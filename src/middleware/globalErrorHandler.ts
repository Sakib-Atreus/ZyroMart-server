/* eslint-disable @typescript-eslint/no-unused-vars */
import { ErrorRequestHandler } from 'express'
import { TErrorMessages } from '../interface/error.interface'
import handleValidationError from '../Error/mongooseValidationError'
import config from '../config'
import handleDuplicateError from '../Error/handleDuplicateError'
import handleCastError from '../Error/handleCastError'
import { ZodError } from 'zod'
import handleZodValidationError from '../Error/handleZodValidationError'
import AppError from '../Error/AppError'
import handleError from '../Error/handleError'

const globalErrorHandler: ErrorRequestHandler = (err, req, res, next) => {
  // Check if headers are already sent to prevent setting
  if (res.headersSent) {
    return next(err)
  }

  let statusCode = err?.statusCode || 500
  let message = err?.message || 'Something went wrong'
  let errorMessages: TErrorMessages = [
    {
      path: '',
      message: 'Something went wrong!',
    },
  ]

  if (err?.name === 'ValidationError') {
    // handling mongoose validation error
    const simplifiedErrorResponse = handleValidationError(err)
    statusCode = simplifiedErrorResponse.statusCode
    message = simplifiedErrorResponse.message
    errorMessages = simplifiedErrorResponse.errorSources
  } else if (err?.code === 11000) {
    // handling duplicate error
    const simplifiedErrorResponse = handleDuplicateError(err)
    statusCode = simplifiedErrorResponse.statusCode
    message = simplifiedErrorResponse.message
    errorMessages = simplifiedErrorResponse.errorSources
  } else if (err?.name === 'CastError') {
    // handling cast error
    const simplifiedErrorResponse = handleCastError(err)
    statusCode = simplifiedErrorResponse.statusCode
    message = simplifiedErrorResponse.message
    errorMessages = simplifiedErrorResponse.errorSources
  } else if (err instanceof ZodError) {
    // handing zod validation error
    const simplifiedErrorResponse = handleZodValidationError(err)
    statusCode = simplifiedErrorResponse.statusCode
    message = simplifiedErrorResponse.message
    errorMessages = simplifiedErrorResponse.errorSources
  } else if (err instanceof AppError || err instanceof Error) {
    const simplifiedErrorResponse = handleError(err)
    statusCode = simplifiedErrorResponse.statusCode
    message = simplifiedErrorResponse.message
    errorMessages = []
  }
  return res.status(statusCode).json({
    success: false,
    message,
    errorMessages,
    error: config.NODE_ENV === 'development' ? err : null,
    stack: config.NODE_ENV === 'development' ? err?.stack : null,
  })
}

export default globalErrorHandler;
