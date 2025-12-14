import { AsyncLocalStorage } from 'async_hooks';
import { Request, Response } from 'express';

export interface RequestContextStore {
  req: Request;
  res: Response;
}

export const requestContext = new AsyncLocalStorage<RequestContextStore>();

export function getCurrentRequest(): Request {
  const store = requestContext.getStore();
  if (!store) throw new Error('No request context found');
  return store.req;
}

export function getCurrentResponse(): Response {
  const store = requestContext.getStore();
  if (!store) throw new Error('No request context found');
  return store.res;
}
