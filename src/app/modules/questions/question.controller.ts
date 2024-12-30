import { Request, Response } from "express";
import { QuestionService } from "./question.service";
import { questionValidationSchema, answerQuestionValidationSchema } from "./question.validation";
import { ZodError } from "zod";

// Controller to create a new question
const createQuestion = async (req: Request, res: Response) => {
  try {
    const questionData = questionValidationSchema.parse(req.body);
    const result = await QuestionService.createQuestion(questionData);

    res.status(201).json({
      success: true,
      message: "Question created successfully!",
      data: result,
    });
  } catch (err: any) {
    if (err instanceof ZodError) {
      res.status(400).json({
        success: false,
        message: "Validation error!",
        errors: err.errors,
      });
    } else {
      res.status(500).json({
        success: false,
        message: "Failed to create the question!",
        error: err.message,
      });
    }
  }
};

// Controller to get all questions
const getAllQuestions = async (req: Request, res: Response) => {
    try {
      const result = await QuestionService.getAllQuestions();
  
      res.status(200).json({
        success: true,
        message: "All questions fetched successfully!",
        data: result,
      });
    } catch (err: any) {
      res.status(500).json({
        success: false,
        message: "Failed to fetch all questions!",
        error: err.message,
      });
    }
  };

  // Controller to get a single question by ID
const getSingleQuestion = async (req: Request, res: Response) => {
    try {
      const { questionId } = req.params;  // Use 'questionId' to match the route parameter
      const result = await QuestionService.getSingleQuestion(questionId);
  
      if (!result) {
        return res.status(404).json({
          success: false,
          message: "Question not found!",
        });
      }
  
      res.status(200).json({
        success: true,
        message: "Question fetched successfully!",
        data: result,
      });
    } catch (err: any) {
      res.status(500).json({
        success: false,
        message: "Failed to fetch the question!",
        error: err.message,
      });
    }
  };
  

// Controller to get questions by product
const getQuestionsByProduct = async (req: Request, res: Response) => {
  try {
    const { productId } = req.params;
    const result = await QuestionService.getQuestionsByProduct(productId);

    res.status(200).json({
      success: true,
      message: "Questions fetched successfully!",
      data: result,
    });
  } catch (err: any) {
    res.status(500).json({
      success: false,
      message: "Failed to fetch questions!",
      error: err.message,
    });
  }
};

// Controller to answer a question (Admin)
const answerQuestion = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { answer } = answerQuestionValidationSchema.parse(req.body);

    const result = await QuestionService.answerQuestion(id, answer);

    if (!result) {
      return res.status(404).json({
        success: false,
        message: "Question not found!",
      });
    }

    res.status(200).json({
      success: true,
      message: "Question answered successfully!",
      data: result,
    });
  } catch (err: any) {
    if (err instanceof ZodError) {
      res.status(400).json({
        success: false,
        message: "Validation error!",
        errors: err.errors,
      });
    } else {
      res.status(500).json({
        success: false,
        message: "Failed to answer the question!",
        error: err.message,
      });
    }
  }
};

// Controller to delete a question by ID
const deleteQuestion = async (req: Request, res: Response) => {
    try {
      const { questionId } = req.params;
      const result = await QuestionService.deleteQuestion(questionId);
  
      if (!result) {
        return res.status(404).json({
          success: false,
          message: "Question not found!",
        });
      }
  
      res.status(200).json({
        success: true,
        message: "Question deleted successfully!",
      });
    } catch (err: any) {
      res.status(500).json({
        success: false,
        message: "Failed to delete the question!",
        error: err.message,
      });
    }
  };

export const QuestionController = {
  createQuestion,
  getAllQuestions,
  getSingleQuestion,
  getQuestionsByProduct,
  answerQuestion,
  deleteQuestion,
};
