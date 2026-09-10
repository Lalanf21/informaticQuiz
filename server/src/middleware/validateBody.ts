import type { Request, Response, NextFunction } from 'express';
import type { ZodTypeAny } from 'zod';

export function validateBody(schema: ZodTypeAny) {
  return (req: Request, _res: Response, next: NextFunction) => {
    const parsed = schema.safeParse(req.body);
    if (!parsed.success) {
      next(parsed.error);
      return;
    }
    req.body = parsed.data;
    next();
  };
}
