import crypto from 'crypto';
import config from '../../config';
import AppError from '../../Error/AppError';
import { TUser } from '../users/user.interface';
import User from '../users/user.model';
import { TLoginUser } from './auth.interface';
import jwt from 'jsonwebtoken';
import bcrypt from 'bcrypt';
import { sendOtpEmail } from '../../utility/sendEmail';

const generateOtp = (): string =>
  Math.floor(100000 + Math.random() * 900000).toString();

// SHA-256 is fast and sufficient for short-lived, rate-limited OTPs
const hashOtp = (otp: string): string =>
  crypto.createHash('sha256').update(otp).digest('hex');

const registeredUserIntoDB = async (payload: TUser) => {
  const email = String(payload.email || '').trim().toLowerCase();
  const phone = String(payload.phone || '').trim();

  const existing = await User.findOne({ $or: [{ email }, { phone }] })
    .select('email phone')
    .lean();

  if (existing) {
    if (existing.email === email) {
      throw new AppError(409, `Email '${email}' is already registered`);
    }
    if (existing.phone === phone) {
      throw new AppError(409, `Phone '${phone}' is already registered`);
    }
  }

  const result = await User.create({ ...payload, email, phone, isVerified: false });

  // Generate OTP and persist it, then fire the email without blocking the response
  const otp = generateOtp();
  const otpExpiry = new Date(Date.now() + 10 * 60 * 1000);

  await User.findByIdAndUpdate(result._id, { otp: hashOtp(otp), otpExpiry });

  sendOtpEmail(result.email, otp, result.name).catch(() => {
    // Email failure is non-fatal — user can request a resend from the UI
  });

  return result;
};

const loginUser = async (payload: TLoginUser) => {
  const user = await User.findOne({ email: payload.email }).select('+password');

  if (!user) {
    throw new AppError(404, 'User does not exists!');
  }

  const isPasswordMatched = await bcrypt.compare(payload.password, user.password);
  if (!isPasswordMatched) {
    throw new AppError(400, 'Password do not matched!');
  }

  // Block unverified users with a recognizable error code the client can act on
  if (user.isVerified === false) {
    throw new AppError(403, 'EMAIL_NOT_VERIFIED');
  }

  const updatedUser = await User.findOneAndUpdate(
    { _id: user._id },
    { isLoggedIn: true, loggedInTime: new Date() },
    { new: true },
  );

  const jwtPayload = {
    userEmail: user.email,
    role: user.role,
    id: user._id.toString(),
  };

  const accessToken = jwt.sign(jwtPayload, config.jwt_access_secret as string, {
    expiresIn: config.jwt_access_expires_in as jwt.SignOptions['expiresIn'],
  });

  return {
    accessToken: `Bearer ${accessToken}`,
    user: updatedUser,
  };
};

const sendOtp = async (email: string): Promise<null> => {
  const user = await User.findOne({ email }).select('name email isVerified otpExpiry');

  if (!user) throw new AppError(404, 'User not found');
  if (user.isVerified) throw new AppError(400, 'Email is already verified');

  // Prevent spamming — enforce a 60-second delay between sends
  if (user.otpExpiry && user.otpExpiry.getTime() - Date.now() > 9 * 60 * 1000) {
    throw new AppError(429, 'Please wait before requesting another OTP');
  }

  const otp = generateOtp();
  const otpExpiry = new Date(Date.now() + 10 * 60 * 1000);

  await User.findByIdAndUpdate(user._id, { otp: hashOtp(otp), otpExpiry });
  await sendOtpEmail(email, otp, user.name);

  return null;
};

const verifyOtp = async (email: string, otp: string): Promise<null> => {
  const user = await User.findOne({ email }).select('+otp otpExpiry isVerified');

  if (!user) throw new AppError(404, 'User not found');
  if (user.isVerified) throw new AppError(400, 'Email is already verified');
  if (!user.otp || !user.otpExpiry) throw new AppError(400, 'No OTP found. Please request a new one');
  if (Date.now() > user.otpExpiry.getTime()) throw new AppError(400, 'OTP has expired. Please request a new one');

  if (hashOtp(otp) !== user.otp) {
    throw new AppError(400, 'Invalid OTP');
  }

  await User.findByIdAndUpdate(user._id, {
    isVerified: true,
    $unset: { otp: 1, otpExpiry: 1 },
  });

  return null;
};

const changePassword = async (email: string, oldPassword: string, newPassword: string) => {
  const user = await User.findOne({ email }).select('+password');
  if (!user) throw new AppError(404, 'User not found');

  const isPasswordMatched = await bcrypt.compare(oldPassword, user.password);
  if (!isPasswordMatched) throw new AppError(400, 'Old password is incorrect');

  const hashedPassword = await bcrypt.hash(newPassword, Number(config.bcrypt_salt_rounds));

  const updatedUser = await User.findOneAndUpdate(
    { email },
    { password: hashedPassword },
    { new: true },
  );

  if (!updatedUser) throw new AppError(500, 'Failed to update password');

  return { message: 'Password updated successfully' };
};

const logOutUser = async (userId: string) => {
  const user = await User.findById(userId);
  if (!user) {
    throw new AppError(404, 'User not found');
  }

  await User.findOneAndUpdate(
    { _id: userId },
    { isLoggedIn: false, loggedOutTime: new Date() },
    { new: true },
  );

  return null;
};

export const AuthServices = {
  registeredUserIntoDB,
  loginUser,
  sendOtp,
  verifyOtp,
  changePassword,
  logOutUser,
};
