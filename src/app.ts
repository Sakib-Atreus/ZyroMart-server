import cors from 'cors';
import express, { Application, Request, Response } from 'express';
import { routes } from './app/routes';
import globalErrorHandler from './app/middleware/globalErrorHandler';
import notFound from './app/middleware/notFoundRoute';

const app: Application = express();

// parser
app.use(express.json());
app.use(cors());

app.use('/api/v1', routes)

// server
const getAController = (req: Request, res: Response) => {
  res.send('Welcome to our ZyroMart E-commerce server management application!');
};

// main server
app.get('/', getAController);

// customize error
app.use(globalErrorHandler)
app.use(notFound)

export default app;
