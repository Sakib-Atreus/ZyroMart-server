import { Response } from 'express';
import { TData } from '../interface/sendResponse.interface';

const sendResponse = <T>(res: Response, data: TData<T>) => {
  const payload: Record<string, unknown> = {
    success: data.success,
    statusCode: data.statusCode,
    message: data.message,
    data: data.data,
  };

  if (data.token) payload.token = data.token;
  if (data.meta) payload.meta = data.meta;

  return res.status(data.statusCode).json(payload);
};

export default sendResponse;
