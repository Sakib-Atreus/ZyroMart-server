import { TErrorMessages } from '../interface/error.interface'

/* eslint-disable @typescript-eslint/no-explicit-any */
const handleDuplicateError = (err: any) => {
  const pattern = /dup key: { id: "(.*?)" }/
  const statusCode = 409
  const message = 'Duplicate error'
  const errorSources: TErrorMessages = [
    {
      path: err.errmsg.match(pattern),
      message: err?.errmsg,
    },
  ]
  return {
    statusCode,
    message,
    errorSources,
  }
}

export default handleDuplicateError;
