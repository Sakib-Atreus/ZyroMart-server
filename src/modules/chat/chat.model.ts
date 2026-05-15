import { Schema, model } from 'mongoose';
import { IConversation, IMessage } from './chat.interface';

const ConversationSchema = new Schema<IConversation>(
  {
    vendor: { type: Schema.Types.ObjectId, ref: 'Vendor', required: true, unique: true, index: true },
    vendorUser: { type: Schema.Types.ObjectId, ref: 'user', required: true, index: true },
    lastMessage: { type: String },
    lastMessageAt: { type: Date },
    unreadByAdmin: { type: Number, default: 0, min: 0 },
    unreadByVendor: { type: Number, default: 0, min: 0 },
  },
  { timestamps: true, versionKey: false },
);

const MessageSchema = new Schema<IMessage>(
  {
    conversation: { type: Schema.Types.ObjectId, ref: 'Conversation', required: true, index: true },
    sender: { type: Schema.Types.ObjectId, ref: 'user', required: true },
    senderRole: { type: String, enum: ['admin', 'vendor'], required: true },
    body: { type: String, required: true, trim: true, maxlength: 2000 },
    readAt: { type: Date },
  },
  { timestamps: true, versionKey: false },
);

MessageSchema.index({ conversation: 1, createdAt: 1 });

export const ConversationModel = model<IConversation>('Conversation', ConversationSchema);
export const MessageModel = model<IMessage>('Message', MessageSchema);
