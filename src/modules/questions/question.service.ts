import { QuestionModel } from "./question.model";
import { Question } from "./question.interface";

// Create a new question
const createQuestion = async (data: Question) => {
  const result = await QuestionModel.create(data);
  return result;
};

// Get all questions
const getAllQuestions = async () => {
    const result = await QuestionModel.find();
    return result;
  };

  // Get a single question by ID
const getSingleQuestion = async (id: string) => {
    const result = await QuestionModel.findById(id);  // This looks good
    return result;
  };

// Get all questions for a specific product
const getQuestionsByProduct = async (productId: string) => {
  const result = await QuestionModel.find({ productId });
  return result;
};

// Answer a question (Admin only)
const answerQuestion = async (id: string, answer: string) => {
  const result = await QuestionModel.findByIdAndUpdate(
    id,
    { answer },
    { new: true, runValidators: true }
  );
  return result;
};

// Delete a question by ID
const deleteQuestion = async (id: string) => {
    const result = await QuestionModel.findByIdAndDelete(id);
    return result;
  };

// Export services
export const QuestionService = {
  createQuestion,
  getAllQuestions,
  getSingleQuestion,
  getQuestionsByProduct,
  answerQuestion,
  deleteQuestion,
};
