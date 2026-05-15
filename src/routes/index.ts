import { Router } from 'express';
import { AuthRoutes } from '../modules/auth/auth.route';
import { UserRoute } from '../modules/users/user.route';
import { CategoryRoute } from '../modules/categories/category.route';
import { VendorRoute } from '../modules/vendors/vendor.route';
import { ProductRoute } from '../modules/products/product.route';
import { VariantRoute } from '../modules/variants/variant.route';
import { CartRoute } from '../modules/carts/cart.route';
import { OrderRoute } from '../modules/orders/order.route';
import { PaymentRoute } from '../modules/payments/payment.route';
import { ReviewRoute } from '../modules/reviews/review.route';
import { QuestionRoute } from '../modules/questions/question.route';
import { WishlistRoute } from '../modules/wishlists/wishlist.route';
import { AnalyticsRoute } from '../modules/analytics/analytics.route';
import { ChatRoute } from '../modules/chat/chat.route';

const router = Router();

const moduleRoutes = [
  { path: '/auth', route: AuthRoutes },
  { path: '/users', route: UserRoute },
  { path: '/categories', route: CategoryRoute },
  { path: '/vendors', route: VendorRoute },
  { path: '/products', route: ProductRoute },
  { path: '/variants', route: VariantRoute },
  { path: '/cart', route: CartRoute },
  { path: '/orders', route: OrderRoute },
  { path: '/payments', route: PaymentRoute },
  { path: '/reviews', route: ReviewRoute },
  { path: '/questions', route: QuestionRoute },
  { path: '/wishlist', route: WishlistRoute },
  { path: '/analytics', route: AnalyticsRoute },
  { path: '/chat', route: ChatRoute },
];

moduleRoutes.forEach(r => router.use(r.path, r.route));

export const routes = router;
