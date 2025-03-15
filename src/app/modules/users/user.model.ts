/* eslint-disable no-delete-var */
import { model, Schema } from 'mongoose'
import { TUser } from './user.interface'
import { nameEnum } from './user.constant'
import bcrypt from 'bcrypt'
import config from '../../config'

const userSchema = new Schema<TUser>(
  {
    name: {
      type: String,
      required: true,
    },
    email: {
      type: String,
      required: true,
      unique: true,
    },
    password: {
      type: String,
      required: true,
      select: 0,
    },
    phone: {
      type: String,
      required: true,
      unique: true,
    },
    role: {
      type: String,
      enum: nameEnum,
      required: true,
    },
    address: {
      type: String,
      required: true,
    },
  },
  { timestamps: true },
)

userSchema.pre('save', async function (next) {
  this.password = await bcrypt.hash(
    this.password,
    Number(config.bcrypt_salt_rounds),
  )
  next()
})
// remove user
userSchema.methods.toJSON = function () {
  const obj = this.toObject()
  delete obj.password
  return obj
}

const User = model<TUser>('user', userSchema)
export default User;
