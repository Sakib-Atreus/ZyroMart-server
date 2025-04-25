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

export const AuthValidations = {
  loginUserValidationSchema,
  changePasswordValidationSchema,
}
