import { Router } from 'express'
import { AuthRoutes } from '../modules/auth/auth.route'
import { ProductRoute } from '../modules/products/product.route'
import { OrderRoute } from '../modules/orders/order.route'
import { ReviewRoute } from '../modules/reviews/review.route'
import { QuestionRoute } from '../modules/questions/question.route'

const router = Router()

const moduleRoutes = [
  {
    path: '/auth',
    route: AuthRoutes,
  },
  {
    path: '/api/products',
    route: ProductRoute,
  },
  {
    path: '/api/orders',
    route: OrderRoute,
  },
  {
    path: '/api/reviews',
    route: ReviewRoute,
  },
  {
    path: '/api/questions',
    route: QuestionRoute,
  },
]

moduleRoutes.forEach(route => {
  router.use(route.path, route.route)
})

export const routes = router;
