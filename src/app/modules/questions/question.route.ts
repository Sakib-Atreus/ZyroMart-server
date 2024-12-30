import express from "express";
import { QuestionController } from "./question.controller";

const router = express.Router();

// Route to create a new question (User)
router.post("/", QuestionController.createQuestion);

// get all reviews
router.get('/', QuestionController.getAllQuestions);

// Route to get a single question by ID
router.get('/:questionId', QuestionController.getSingleQuestion); 

// Route to get questions by product ID
router.get("/:productId", QuestionController.getQuestionsByProduct);

// Route to answer a question (Admin only)
router.put("/:id/answer", QuestionController.answerQuestion);

// Route to delete a question by ID
router.delete('/:questionId', QuestionController.deleteQuestion);

export const QuestionRoute = router;
