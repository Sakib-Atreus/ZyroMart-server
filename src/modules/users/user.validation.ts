import { z } from 'zod'

// Signup schema — role is intentionally NOT accepted from the client.
// The controller forces role='user' server-side; admin/vendor promotion
// happens through other explicit paths (adminSeeder, vendor approval).
const userCreateValidationSchema = z.object({
  body: z.object({
    name: z.string().min(1, { message: 'Name is required!' }),
    email: z.string().email({ message: 'Invalid email address!' }),
    password: z
      .string()
      .min(6, { message: 'Password must be at least 6 characters long!' }),
    phone: z.string().min(1, { message: 'Phone number is required!' }),
    address: z.string().min(1, { message: 'Address is required!' }),
  }).strip(),
})

const updateMeValidationSchema = z.object({
  body: z.object({
    name: z.string().min(1).max(80).optional(),
    phone: z.string().min(5).max(20).optional(),
    address: z.string().min(1).max(300).optional(),
  }),
});

export const UserValidations = {
  userCreateValidationSchema,
  updateMeValidationSchema,
}
