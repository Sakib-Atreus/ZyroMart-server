import { NextFunction, Request, Response } from 'express';
import { AnyZodObject } from 'zod';

const validateRequest = (schema: AnyZodObject) => {
  return async (req: Request, res: Response, next: NextFunction) => {
    try {
      const parsed = await schema.parseAsync({
        body: req.body,
        params: req.params,
        query: req.query,
      });
      // Write the parsed values back so Zod defaults / transforms take effect
      // in the downstream controller (e.g. role='user' defaults, coerced numbers).
      if (parsed && typeof parsed === 'object') {
        if ('body' in parsed && parsed.body !== undefined) req.body = parsed.body;
        if ('params' in parsed && parsed.params !== undefined) {
          req.params = parsed.params as typeof req.params;
        }
        // req.query is a read-only getter in Express 5 — skip reassigning it.
      }
      next();
    } catch (err) {
      next(err);
    }
  };
};

export default validateRequest;
