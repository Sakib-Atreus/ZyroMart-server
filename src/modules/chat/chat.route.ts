import express from 'express';
import auth from '../../middleware/auth';
import validateRequest from '../../middleware/validateRequest';
import { USER_ROLE } from '../users/user.constant';
import { ChatControllers } from './chat.controller';
import { sendMessageSchema, conversationParamsSchema } from './chat.validation';

const router = express.Router();

// Vendor: send message to admin (creates conversation lazily)
router.post(
  '/messages',
  auth(USER_ROLE.vendor),
  validateRequest(sendMessageSchema),
  ChatControllers.vendorSendMessage,
);

// Vendor: get own conversation thread
router.get(
  '/me',
  auth(USER_ROLE.vendor),
  ChatControllers.getMyConversation,
);

// Admin: list all conversations
router.get(
  '/',
  auth(USER_ROLE.admin),
  ChatControllers.listConversations,
);

// Admin: reply to a specific conversation
router.post(
  '/:conversationId/messages',
  auth(USER_ROLE.admin),
  validateRequest(sendMessageSchema),
  ChatControllers.adminSendMessage,
);

// Shared: read messages (vendor sees own, admin sees any)
router.get(
  '/:conversationId/messages',
  auth(USER_ROLE.vendor, USER_ROLE.admin),
  validateRequest(conversationParamsSchema),
  ChatControllers.getMessages,
);

export const ChatRoute = router;
