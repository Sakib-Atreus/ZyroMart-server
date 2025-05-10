// import express from 'express';
// import { ProductControllers } from './product.controller';
// import auth from '../../middleware/auth';
// import { USER_ROLE } from '../users/user.constant';

// const router = express.Router();

// // this all routes call the controllers function to :
// // create or post a new product
// router.post('/', auth(USER_ROLE.admin), ProductControllers.createProduct);

// // get all products
// router.get('/', ProductControllers.getAllProducts);

// // get a single product
// router.get('/:productId', ProductControllers.getSingleProduct);

// // delete a single product
// router.delete(
//   '/:productId',
//   auth(USER_ROLE.admin),
//   ProductControllers.deleteProduct,
// );

// // update a single product
// router.put(
//   '/:productId',
//   auth(USER_ROLE.admin),
//   ProductControllers.updateProduct,
// );

// export const ProductRoute = router;



import express from 'express';
import { ProductControllers } from './product.controller';
import auth from '../../middleware/auth';
import { USER_ROLE } from '../users/user.constant';
import { filterMiddleware } from '../../middleware/filterProductMiddleware';

const router = express.Router();

// route for creating a new product
router.post('/', auth(USER_ROLE.admin, USER_ROLE.user), ProductControllers.createProduct);

// route for getting all products with filter middleware
router.get('/', filterMiddleware, ProductControllers.getAllProducts);

// route for getting a single product
router.get('/:productId', ProductControllers.getSingleProduct);

// route for deleting a single product
router.delete('/:productId', auth(USER_ROLE.admin, USER_ROLE.user), ProductControllers.deleteProduct);

// route for updating a single product
router.put('/:productId', auth(USER_ROLE.admin, USER_ROLE.user), ProductControllers.updateProduct);

export const ProductRoute = router;