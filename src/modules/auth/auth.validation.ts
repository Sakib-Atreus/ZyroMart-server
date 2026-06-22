import { z } from 'zod'

const loginUserValidationSchema = z.object({
  body: z.object({
    email: z.string({ required_error: 'Email is requires' }),
    password: z.string({ required_error: 'Password is required' }),
  }),
})

const changePasswordValidationSchema = z.object({
  body: z.object({
    oldPassword: z.string().min(6),
    newPassword: z.string().min(6),
  }),
});

const sendOtpValidationSchema = z.object({
  body: z.object({
    email: z.string().email({ message: 'Valid email is required' }),
  }),
});

const verifyOtpValidationSchema = z.object({
  body: z.object({
    email: z.string().email({ message: 'Valid email is required' }),
    otp: z.string().length(6, { message: 'OTP must be 6 digits' }).regex(/^\d+$/, { message: 'OTP must be numeric' }),
  }),
});

const forgotPasswordValidationSchema = z.object({
  body: z.object({
    email: z.string().email({ message: 'Valid email is required' }),
  }),
});

const resetPasswordValidationSchema = z.object({
  body: z.object({
    token: z.string().min(1, { message: 'Token is required' }),
    newPassword: z.string().min(6, { message: 'Password must be at least 6 characters' }),
  }),
});

export const AuthValidations = {
  loginUserValidationSchema,
  changePasswordValidationSchema,
  sendOtpValidationSchema,
  verifyOtpValidationSchema,
  forgotPasswordValidationSchema,
  resetPasswordValidationSchema,
}
