import { Types } from 'mongoose';

export type TChatParticipantRole = 'admin' | 'vendor';

export interface IMessage {
  _id?: Types.ObjectId;
  conversation: Types.ObjectId;
  sender: Types.ObjectId;       // User._id
  senderRole: TChatParticipantRole;
  body: string;
  readAt?: Date;
  createdAt?: Date;
}

export interface IConversation {
  _id?: Types.ObjectId;
  vendor: Types.ObjectId;       // Vendor._id
  vendorUser: Types.ObjectId;   // User._id of the vendor
  lastMessage?: string;
  lastMessageAt?: Date;
  unreadByAdmin: number;
  unreadByVendor: number;
  createdAt?: Date;
  updatedAt?: Date;
}
