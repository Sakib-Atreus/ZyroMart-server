import config from '../../config';
import AppError from '../../Error/AppError';
import { TUser } from '../users/user.interface';
import User from '../users/user.model';
import { TLoginUser } from './auth.interface';
// import status from 'http-status'
import jwt from 'jsonwebtoken';
import bcrypt from 'bcrypt';

const registeredUserIntoDB = async (payload: TUser) => {
  const result = await User.create(payload);
  return result;
};

const loginUser = async (payload: TLoginUser) => {
  const user = await User.findOne({ email: payload.email }).select('+password');
  // check user exists
  if (!user) {
    // throw new AppError(status.NOT_FOUND, 'User does not exists!')
    throw new AppError(404, 'User does not exists!');
  }
  // check password
  const isPasswordMatched = await bcrypt.compare(
    payload?.password,
    user?.password,
  );
  if (!isPasswordMatched) {
    throw new AppError(400, 'Password do not matched!');
  }
   // Update the user status to logged in and log the login time
  const updatedUser = await User.findOneAndUpdate(
    { _id: user._id },
    { 
      isLoggedIn: true, 
      loggedInTime: new Date() 
    },
    { new: true }
  );

  const jwtPayload = {
    userEmail: user?.email,
    role: user?.role,
  };
  const accessToken = jwt.sign(jwtPayload, config.jwt_access_secret as string, {
    expiresIn: config.jwt_access_expires_in,
  });
  return {
    accessToken: `Bearer ${accessToken}`,
    user: updatedUser,
  };
};

const changePassword = async (email: string, oldPassword: string, newPassword: string) => {
  const user = await User.findOne({ email }).select('+password');
  if (!user) throw new AppError(404, 'User not found');

  const isPasswordMatched = await bcrypt.compare(oldPassword, user.password);
  if (!isPasswordMatched) throw new AppError(400, 'Old password is incorrect');

  const hashedPassword = await bcrypt.hash(newPassword, 10);
  user.password = hashedPassword;
  await user.save();

  return { message: 'Password updated successfully' };
};

const logOutUser = async (userId: string) => {


  const logoutUser = await User.findOneAndUpdate(
    { _id: userId},
    { isLoggedIn: false, loggedOutTime: new Date() },
    { new: true },
  );

  return logoutUser;
};


export const AuthServices = {
  registeredUserIntoDB,
  loginUser,
  changePassword,
  logOutUser
};
