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

router.post('/', ProductControllers.createProduct);
router.get('/', filterMiddleware, ProductControllers.getAllProducts);
router.get('/:productId', ProductControllers.getSingleProduct);
router.delete('/:productId', auth(USER_ROLE.admin), ProductControllers.deleteProduct);
router.put('/:productId', ProductControllers.updateProduct);

export const ProductRoute = router;
