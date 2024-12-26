/* eslint-disable @typescript-eslint/no-explicit-any */
const handleError = (err: any) => {
  const statusCode = err.statusCode || 400
  const message = err.message
  return {
    statusCode,
    message,
  }
}
export default handleError;
