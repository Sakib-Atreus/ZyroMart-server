import { JwtPayload } from 'jsonwebtoken'
import { FilterQuery } from 'mongoose'
import { Product } from '../modules/products/product.interface'

declare global {
  namespace Express {
    interface Request {
      user: JwtPayload
      filterQuery?: FilterQuery<Product>;
    }
  }
}
