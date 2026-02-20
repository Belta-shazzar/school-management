import { Response } from 'express';

interface DispatchOptions {
  ok: boolean;
  data?: any;
  code?: number;
  errors?: any;
  message?: string;
  msg?: string;
}

export default class ResponseDispatcher {
  public key: string;

  constructor() {
    this.key = 'responseDispatcher';
  }

  dispatch(res: Response, { ok, data, code, errors, message, msg }: DispatchOptions): Response {
    const statusCode = code ? code : ok === true ? 200 : 400;
    return res.status(statusCode).send({
      ok: ok || false,
      data: data || {},
      errors: errors || [],
      message: msg || message || '',
    });
  }
}
