import express from 'express';
import auth from '../../middleware/auth';
import validateRequest from '../../middleware/validateRequest';
import { USER_ROLE } from '../users/user.constant';
import { QuestionControllers } from './question.controller';
import {
  createQuestionSchema,
  answerQuestionSchema,
  questionIdParamsSchema,
  questionByProductParamsSchema,
} from './question.validation';

const router = express.Router();

router.get(
  '/product/:productId',
  validateRequest(questionByProductParamsSchema),
  QuestionControllers.listByProduct,
);

router.post(
  '/',
  auth(USER_ROLE.user, USER_ROLE.vendor, USER_ROLE.admin),
  validateRequest(createQuestionSchema),
  QuestionControllers.createQuestion,
);

router.post(
  '/:id/answer',
  auth(USER_ROLE.vendor, USER_ROLE.admin),
  validateRequest(answerQuestionSchema),
  QuestionControllers.answerQuestion,
);

router.delete(
  '/:id',
  auth(USER_ROLE.user, USER_ROLE.vendor, USER_ROLE.admin),
  validateRequest(questionIdParamsSchema),
  QuestionControllers.deleteQuestion,
);

export const QuestionRoute = router;
