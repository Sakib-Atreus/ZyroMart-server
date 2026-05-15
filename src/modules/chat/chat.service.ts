import AppError from '../../Error/AppError';
import { VendorModel } from '../vendors/vendor.model';
import { ConversationModel, MessageModel } from './chat.model';

// Get or create the single conversation thread for a vendor
const getOrCreateConversation = async (vendorId: string, vendorUserId: string) => {
  let conversation = await ConversationModel.findOne({ vendor: vendorId });
  if (!conversation) {
    conversation = await ConversationModel.create({
      vendor: vendorId,
      vendorUser: vendorUserId,
    });
  }
  return conversation;
};

// Vendor sends a message to admin
const vendorSendMessage = async (userId: string, body: string) => {
  const vendor = await VendorModel.findOne({ user: userId, status: 'approved' });
  if (!vendor) throw new AppError(403, 'Approved vendor profile required');

  const conversation = await getOrCreateConversation(
    vendor._id.toString(),
    userId,
  );

  const message = await MessageModel.create({
    conversation: conversation._id,
    sender: userId,
    senderRole: 'vendor',
    body,
  });

  await ConversationModel.findByIdAndUpdate(conversation._id, {
    lastMessage: body.slice(0, 100),
    lastMessageAt: new Date(),
    $inc: { unreadByAdmin: 1 },
  });

  return message;
};

// Admin sends a message to a vendor conversation
const adminSendMessage = async (
  adminUserId: string,
  conversationId: string,
  body: string,
) => {
  const conversation = await ConversationModel.findById(conversationId);
  if (!conversation) throw new AppError(404, 'Conversation not found');

  const message = await MessageModel.create({
    conversation: conversationId,
    sender: adminUserId,
    senderRole: 'admin',
    body,
  });

  await ConversationModel.findByIdAndUpdate(conversationId, {
    lastMessage: body.slice(0, 100),
    lastMessageAt: new Date(),
    $inc: { unreadByVendor: 1 },
  });

  return message;
};

// Get messages for a conversation (paginated, oldest first)
const getMessages = async (
  conversationId: string,
  actorUserId: string,
  actorRole: string,
  page = 1,
  limit = 30,
) => {
  const conversation = await ConversationModel.findById(conversationId);
  if (!conversation) throw new AppError(404, 'Conversation not found');

  // Access control
  if (actorRole !== 'admin' && conversation.vendorUser.toString() !== actorUserId) {
    throw new AppError(403, 'Forbidden');
  }

  const skip = (page - 1) * limit;
  const [messages, total] = await Promise.all([
    MessageModel.find({ conversation: conversationId })
      .sort({ createdAt: 1 })
      .skip(skip)
      .limit(limit)
      .lean(),
    MessageModel.countDocuments({ conversation: conversationId }),
  ]);

  // Mark unread for the reader
  const unreadField = actorRole === 'admin' ? 'unreadByAdmin' : 'unreadByVendor';
  await ConversationModel.findByIdAndUpdate(conversationId, { [unreadField]: 0 });

  return {
    data: messages,
    meta: { page, limit, total, totalPages: Math.ceil(total / limit) || 1 },
  };
};

// Admin: list all conversations
const listConversationsForAdmin = async () => {
  return ConversationModel.find()
    .populate('vendor', 'shopName slug logo')
    .populate('vendorUser', 'name email')
    .sort({ lastMessageAt: -1 })
    .lean();
};

// Vendor: get their own conversation
const getMyConversation = async (userId: string) => {
  const vendor = await VendorModel.findOne({ user: userId });
  if (!vendor) throw new AppError(403, 'Vendor profile required');

  const conversation = await ConversationModel.findOne({ vendor: vendor._id })
    .populate('vendor', 'shopName slug')
    .lean();

  return conversation ?? null;
};

export const ChatServices = {
  vendorSendMessage,
  adminSendMessage,
  getMessages,
  listConversationsForAdmin,
  getMyConversation,
};
