import { USER_ROLE } from './user.constant'

export type TUser = {
  name: string
  email: string
  password: string
  phone: string
  role: 'admin' | 'user'
  address: string
  isDeleted?:string,
  isLoggedIn?:boolean
  loggedOutTime?:Date
}

export type TUserRole = keyof typeof USER_ROLE
