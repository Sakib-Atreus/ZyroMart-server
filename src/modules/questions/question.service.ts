import { Types } from 'mongoose';
import AppError from '../../Error/AppError';
import QueryBuilder from '../../utility/QueryBuilder';
import { ProductModel } from '../products/product.model';
import { VendorModel } from '../vendors/vendor.model';
import { QuestionModel } from './question.model';

const syncProductQuestionCount = async (productId: Types.ObjectId | string) => {
  const count = await QuestionModel.countDocuments({ product: productId });
  await ProductModel.findByIdAndUpdate(productId, { questionCount: count });
};

const createQuestion = async (
  userId: string,
  input: { product: string; question: string },
) => {
  const product = await ProductModel.findById(input.product).select('status isDeleted').lean();
  if (!product || product.isDeleted || product.status !== 'approved') {
    throw new AppError(404, 'Product not available');
  }
  const q = await QuestionModel.create({
    product: input.product,
    user: userId,
    question: input.question,
  });
  await syncProductQuestionCount(input.product);
  return q;
};

const answerQuestion = async (
  actor: { id: string; role: string },
  questionId: string,
  answerText: string,
) => {
  const q = await QuestionModel.findById(questionId);
  if (!q) throw new AppError(404, 'Question not found');

  // Only the product's vendor or an admin may answer
  if (actor.role !== 'admin') {
    const product = await ProductModel.findById(q.product).select('vendor').lean();
    if (!product) throw new AppError(404, 'Product not found');
    const vendor = await VendorModel.findOne({ user: actor.id });
    if (!vendor || product.vendor.toString() !== vendor._id.toString()) {
      throw new AppError(403, 'Only the product owner or an admin can answer');
    }
  }

  q.answer = {
    text: answerText,
    by: new Types.ObjectId(actor.id),
    at: new Date(),
  };
  await q.save();
  return q;
};

const deleteQuestion = async (
  actor: { id: string; role: string },
  questionId: string,
) => {
  const q = await QuestionModel.findById(questionId);
  if (!q) throw new AppError(404, 'Question not found');

  const isAdmin = actor.role === 'admin';
  const isAsker = q.user.toString() === actor.id;
  if (!isAdmin && !isAsker) {
    throw new AppError(403, 'Only the asker or an admin can delete this question');
  }

  const productId = q.product;
  await q.deleteOne();
  await syncProductQuestionCount(productId);
  return { _id: questionId };
};

const listByProduct = async (productId: string, query: Record<string, unknown>) => {
  const builder = new QueryBuilder(
    QuestionModel.find({ product: productId })
      .populate('user', 'name')
      .populate('answer.by', 'name role'),
    query,
  )
    .sort()
    .paginate();
  const [data, meta] = await Promise.all([
    builder.modelQuery.lean(),
    builder.countTotal(),
  ]);
  return { data, meta };
};

export const QuestionServices = {
  createQuestion,
  answerQuestion,
  deleteQuestion,
  listByProduct,
  syncProductQuestionCount,
};
