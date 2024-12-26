import cors from 'cors';
import express, { Application, Request, Response } from 'express';
import { routes } from './app/routes';
import globalErrorHandler from './app/middleware/globalErrorHandler';
import notFound from './app/middleware/notFoundRoute';

const app: Application = express();

// parser
app.use(express.json());
app.use(cors());

app.use('/', routes)

// application routes
// app.use('/api/products', ProductRoute);
// app.use('/api/orders', OrderRoute);

// server
const getAController = (req: Request, res: Response) => {
  res.send('Welcome to our ZyroMart E-commerce server management application!');
};

// main server
app.get('/', getAController);

// Handle other or false route and return a 404 error
// app.use('*', (req: Request, res: Response) => {
//   res.status(404).json({
//     success: false,
//     message: 'Route not found!',
//   });
// });

// customize error
app.use(globalErrorHandler)
app.use(notFound)

export default app;
