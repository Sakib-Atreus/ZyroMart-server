import { JwtPayload } from 'jsonwebtoken';
import { FilterQuery } from 'mongoose';

export type TAuthPayload = JwtPayload & {
  id: string;
  role: 'admin' | 'user' | 'vendor';
  userEmail: string;
};

declare global {
  // eslint-disable-next-line @typescript-eslint/no-namespace
  namespace Express {
    interface Request {
      user: TAuthPayload;
      filterQuery?: FilterQuery<unknown>;
    }
  }
}
