import { Types } from 'mongoose';

export interface IQuestionAnswer {
  text: string;
  by: Types.ObjectId; // vendor of the product or admin
  at: Date;
}

export interface IQuestion {
  product: Types.ObjectId;
  user: Types.ObjectId; // the asker
  question: string;
  answer?: IQuestionAnswer;
}
