import AppError from '../../Error/AppError';
import User from './user.model';

type UpdatableUserFields = {
  name?: string;
  phone?: string;
  address?: string;
};

const getMe = async (userId: string) => {
  const user = await User.findById(userId);
  if (!user || user.isDeleted) throw new AppError(404, 'User not found');
  return user;
};

const updateMe = async (userId: string, payload: UpdatableUserFields) => {
  const user = await User.findByIdAndUpdate(userId, payload, {
    new: true,
    runValidators: true,
  });
  if (!user || user.isDeleted) throw new AppError(404, 'User not found');
  return user;
};

export const UserServices = {
  getMe,
  updateMe,
};
