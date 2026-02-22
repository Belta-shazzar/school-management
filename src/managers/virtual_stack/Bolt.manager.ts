import { Request, Response } from 'express';
import logger from '../../libs/logger';

interface BoltArgs {
  mwsRepo: Record<string, any>;
  stack: string[];
  req: Request;
  res: Response;
  onDone: (args: { req: Request; res: Response; results: Record<string, any> }) => void;
  onError?: (args: { error: string }) => void;
}

export default class StackBolt {
  private mwsRepo: Record<string, any>;
  private stack: string[];
  private req: Request;
  private res: Response;
  private index: number;
  private results: Record<string, any>;
  private onDone: (args: { req: Request; res: Response; results: Record<string, any> }) => void;
  private onError: (args: { error: string }) => void;

  constructor({ mwsRepo, stack, req, res, onDone, onError }: BoltArgs) {
    this.mwsRepo = mwsRepo;
    this.stack = stack;
    this.index = 0;
    this.req = req;
    this.res = res;
    this.results = {};
    this.onDone = onDone || (() => {});
    this.onError = onError || (() => {});

    this.run = this.run.bind(this);
    this.next = this.next.bind(this);
    this.end = this.end.bind(this);
  }

  end({ error }: { error?: string } = {}): void {
    const err = error || 'Unexpected Failure';
    (this.req as any).stackError = err;

    if (this.index === this.stack.length - 1) {
      if (this.res.end) this.res.end();
    } else {
      this.index = this.stack.length - 1;
      this.run({ index: this.index });
    }
  }

  next(data?: any, index?: number): void {
    this.results[this.stack[this.index]] = data || {};
    const indexToBe = index || this.index + 1;

    if (!this.stack[indexToBe]) {
      this.onDone({ req: this.req, res: this.res, results: this.results });
      return;
    } else {
      this.index = indexToBe;
    }
    this.run({ index: this.index });
  }

  run({ index }: { index?: number } = {}): void {
    const tIndex = index ?? this.index;

    if (!this.stack[tIndex]) {
      return;
    }

    const fnKey = this.stack[tIndex];
    const fn = this.mwsRepo[fnKey];

    if (!fn) {
      logger.error(`Middleware not found in mwsRepo: ${fnKey}`);
      this.end({ error: `function not found: ${fnKey}` });
    } else {
      try {
        fn({
          req: this.req,
          res: this.res,
          results: this.results,
          next: this.next,
          end: this.end,
          stack: this.stack,
          self: fn,
        });
      } catch (err) {
        logger.error(`Middleware execution failed: ${fnKey}`, { error: err });
        this.end({ error: `execution failed on function ${fnKey}, ${err}` });
      }
    }
  }
}
