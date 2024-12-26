import { z } from 'zod'
import { nameEnum } from './user.constant'

// Define the enum values as a Zod enum
const roleEnum = z.enum(nameEnum as [string, ...string[]])

const userCreateValidationSchema = z.object({
  body: z.object({
    name: z.string().min(1, { message: 'Name is required' }),
    email: z.string().email({ message: 'Invalid email address' }),
    password: z
      .string()
      .min(8, { message: 'Password must be at least 8 characters long' }),
    phone: z.string().min(1, { message: 'Phone number is required' }),
    role: roleEnum,
    address: z.string().min(1, { message: 'Address is required' }),
  }),
})

export const UserValidations = {
  userCreateValidationSchema,
}
