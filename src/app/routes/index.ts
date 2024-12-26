import { Router } from 'express'
import { AuthRoutes } from '../modules/auth/auth.route'
import { ProductRoute } from '../modules/products/product.route'
import { OrderRoute } from '../modules/orders/order.route'

const router = Router()

const moduleRoutes = [
  {
    path: '/api/auth',
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
]

moduleRoutes.forEach(route => {
  router.use(route.path, route.route)
})

export const routes = router;