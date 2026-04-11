import mongoose from 'mongoose'

const handleCastError = (err: mongoose.Error.CastError) => {
  const statusCode = 400
  const message = 'CastError'
  const errorSources = [
    {
      path: err?.path,
      message: err?.message,
    },
  ]
  return {
    statusCode,
    message,
    errorSources,
  }
}

export default handleCastError;
