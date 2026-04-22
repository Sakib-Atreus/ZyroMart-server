import AppError from '../../Error/AppError';
import QueryBuilder from '../../utility/QueryBuilder';
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

// Admin: paginated/searchable user list for admin tools (selectors, user mgmt)
const adminList = async (query: Record<string, unknown>) => {
  const builder = new QueryBuilder(
    User.find({ isDeleted: { $ne: true } }),
    query,
  )
    .search(['name', 'email', 'phone'])
    .filter()
    .sort()
    .paginate()
    .fields();

  const [data, meta] = await Promise.all([
    builder.modelQuery.select('-password').lean(),
    builder.countTotal(),
  ]);
  return { data, meta };
};

export const UserServices = {
  getMe,
  updateMe,
  adminList,
};
