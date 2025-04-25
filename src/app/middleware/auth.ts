import { NextFunction, Request, Response } from 'express';
import catchAsync from '../utility/catchAsync';
import AppError from '../Error/AppError';
import jwt, { JwtPayload } from 'jsonwebtoken';
import config from '../config';
import { TUserRole } from '../modules/users/user.interface';
import User from '../modules/users/user.model';

const auth = (...userRoles: TUserRole[]) => {
  return catchAsync(async (req: Request, res: Response, next: NextFunction) => {
    const token = req.headers.authorization?.split(' ')[1];
    // check is token came from client
    if (!token) {
      throw new AppError(401, 'You are not authorized');
    }
    const decoded = jwt.verify(
      token,
      config.jwt_access_secret as string,
    ) as JwtPayload;

    // Check if user exists and is logged in
    const user = await User.findById(decoded.id);
    if (!user) {
      throw new AppError(404, 'User not found');
    }
    if (!user.isLoggedIn) {
      throw new AppError(401, 'User is not logged in');
    }

    // check user role
    if (userRoles && !userRoles.includes(decoded?.role)) {
      throw new AppError(401, 'You have no access to this route');
    }
    req.user = decoded as JwtPayload;
    next();
  });
};

export default auth;
