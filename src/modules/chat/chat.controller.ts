import { Request, Response } from 'express';
import catchAsync from '../../utility/catchAsync';
import sendResponse from '../../utility/sendResponse';
import { ChatServices } from './chat.service';

const vendorSendMessage = catchAsync(async (req: Request, res: Response) => {
  const result = await ChatServices.vendorSendMessage(req.user.id, req.body.body);
  sendResponse(res, { statusCode: 201, success: true, message: 'Message sent', data: result });
});

const adminSendMessage = catchAsync(async (req: Request, res: Response) => {
  const result = await ChatServices.adminSendMessage(
    req.user.id,
    req.params.conversationId,
    req.body.body,
  );
  sendResponse(res, { statusCode: 201, success: true, message: 'Message sent', data: result });
});

const getMessages = catchAsync(async (req: Request, res: Response) => {
  const page = Math.max(1, Number(req.query.page) || 1);
  const limit = Math.min(100, Number(req.query.limit) || 30);
  const { data, meta } = await ChatServices.getMessages(
    req.params.conversationId,
    req.user.id,
    req.user.role,
    page,
    limit,
  );
  sendResponse(res, { statusCode: 200, success: true, message: 'Messages fetched', data, meta });
});

const listConversations = catchAsync(async (_req: Request, res: Response) => {
  const data = await ChatServices.listConversationsForAdmin();
  sendResponse(res, { statusCode: 200, success: true, message: 'Conversations fetched', data });
});

const getMyConversation = catchAsync(async (req: Request, res: Response) => {
  const data = await ChatServices.getMyConversation(req.user.id);
  sendResponse(res, { statusCode: 200, success: true, message: 'Conversation fetched', data });
});

export const ChatControllers = {
  vendorSendMessage,
  adminSendMessage,
  getMessages,
  listConversations,
  getMyConversation,
};
