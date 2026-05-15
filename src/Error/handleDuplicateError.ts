/* eslint-disable @typescript-eslint/no-explicit-any */
import { TErrorMessages } from '../interface/error.interface';

/**
 * Translate a MongoDB E11000 (duplicate key) error into a clear, specific
 * response. Uses `err.keyValue` (the native field→value object) so the
 * response tells the caller exactly which field and which value collided.
 */
const handleDuplicateError = (err: any) => {
  const statusCode = 409;

  // err.keyValue shape: { email: "test@mail.com" }  (driver ≥ 3.6)
  const keyValue: Record<string, unknown> = err?.keyValue ?? {};
  const field = Object.keys(keyValue)[0];
  const value = field ? keyValue[field] : undefined;

  const message = field
    ? `${field} '${String(value)}' is already in use`
    : 'Duplicate value — already exists';

  const errorSources: TErrorMessages = [
    {
      path: field ?? '',
      message,
    },
  ];

  return { statusCode, message, errorSources };
};

export default handleDuplicateError;
