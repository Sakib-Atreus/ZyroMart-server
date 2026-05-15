import { NextFunction, Request, Response } from 'express';
import catchAsync from '../utility/catchAsync';
import AppError from '../Error/AppError';
import jwt, { JwtPayload } from 'jsonwebtoken';
import config from '../config';
import { TUserRole } from '../modules/users/user.interface';
import User from '../modules/users/user.model';

const auth = (...userRoles: TUserRole[]) => {
  return catchAsync(async (req: Request, _res: Response, next: NextFunction) => {
    const token = req.headers.authorization?.split(' ')[1];
    if (!token) {
      throw new AppError(401, 'You are not authorized');
    }

    // 401 — any JWT verification failure means the session is invalid
    let decoded: JwtPayload;
    try {
      decoded = jwt.verify(token, config.jwt_access_secret as string) as JwtPayload;
    } catch {
      throw new AppError(401, 'Invalid or expired token');
    }

    const user = await User.findById(decoded.id);
    if (!user || user.isDeleted) {
      throw new AppError(401, 'Session invalid — user no longer exists');
    }
    if (!user.isLoggedIn) {
      throw new AppError(401, 'User is not logged in');
    }

    // 403 — authenticated but not allowed to access this specific resource
    if (userRoles.length > 0 && !userRoles.includes(decoded.role as TUserRole)) {
      throw new AppError(403, 'You do not have access to this resource');
    }

    req.user = decoded as typeof req.user;
    next();
  });
};

export default auth;
