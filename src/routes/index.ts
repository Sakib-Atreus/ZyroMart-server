import { Router } from 'express'
import { AuthRoutes } from '../modules/auth/auth.route'
import { ProductRoute } from '../modules/products/product.route'
import { OrderRoute } from '../modules/orders/order.route'
import { ReviewRoute } from '../modules/reviews/review.route'
import { QuestionRoute } from '../modules/questions/question.route'
import { VariantRoute } from '../modules/variants/variant.route'

const router = Router()

const moduleRoutes = [
  {
    path: '/auth',
    route: AuthRoutes,
  },
  {
    path: '/products',
    route: ProductRoute,
  },
  {
    path: '/variants',
    route: VariantRoute,
  },
  {
    path: '/orders',
    route: OrderRoute,
  },
  {
    path: '/reviews',
    route: ReviewRoute,
  },
  {
    path: '/questions',
    route: QuestionRoute,
  },
]

moduleRoutes.forEach(route => {
  router.use(route.path, route.route)
})

export const routes = router;
