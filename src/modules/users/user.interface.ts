import { USER_ROLE } from './user.constant';

export type TUser = {
  name: string;
  email: string;
  password: string;
  phone: string;
  role: 'admin' | 'user' | 'vendor';
  address: string;
  isLoggedIn?: boolean;
  loggedInTime?: Date;
  loggedOutTime?: Date;
  isDeleted?: boolean;
  isVerified?: boolean;
  otp?: string;
  otpExpiry?: Date;
  resetPasswordToken?: string;
  resetPasswordExpiry?: Date;
};

export type TUserRole = keyof typeof USER_ROLE;
