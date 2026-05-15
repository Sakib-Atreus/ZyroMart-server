import { Request, Response } from 'express';
import catchAsync from '../../utility/catchAsync';
import sendResponse from '../../utility/sendResponse';
import { QuestionServices } from './question.service';

const createQuestion = catchAsync(async (req: Request, res: Response) => {
  const result = await QuestionServices.createQuestion(req.user.id, req.body);
  sendResponse(res, {
    statusCode: 201,
    success: true,
    message: 'Question posted',
    data: result,
  });
});

const answerQuestion = catchAsync(async (req: Request, res: Response) => {
  const result = await QuestionServices.answerQuestion(
    { id: req.user.id, role: req.user.role },
    req.params.id,
    req.body.answer,
  );
  sendResponse(res, {
    statusCode: 200,
    success: true,
    message: 'Question answered',
    data: result,
  });
});

const deleteQuestion = catchAsync(async (req: Request, res: Response) => {
  const result = await QuestionServices.deleteQuestion(
    { id: req.user.id, role: req.user.role },
    req.params.id,
  );
  sendResponse(res, {
    statusCode: 200,
    success: true,
    message: 'Question deleted',
    data: result,
  });
});

const listByProduct = catchAsync(async (req: Request, res: Response) => {
  const { data, meta } = await QuestionServices.listByProduct(
    req.params.productId,
    req.query as Record<string, unknown>,
  );
  sendResponse(res, {
    statusCode: 200,
    success: true,
    message: 'Questions fetched',
    data,
    meta,
  });
});

export const QuestionControllers = {
  createQuestion,
  answerQuestion,
  deleteQuestion,
  listByProduct,
};
