import { ZodError } from 'zod'
import { TErrorMessages } from '../interface/error.interface'

const handleZodValidationError = (err: ZodError) => {
  const statusCode = 400
  const message = 'Validation error'
  const errorSources: TErrorMessages = err?.issues.map(issue => {
    return {
      path: issue?.path[issue.path.length - 1],
      message: issue?.message,
    }
  })
  return {
    statusCode,
    message,
    errorSources,
  }
}

export default handleZodValidationError;
