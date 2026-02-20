import StackBolt from './Bolt.manager';
import { Request, Response } from 'express';

interface VirtualStackArgs {
  mwsRepo: Record<string, any>;
  preStack?: string[];
}

export default class VirtualStack {
  private mwsRepo: Record<string, any>;
  private preStack: string[];

  constructor({ mwsRepo, preStack }: VirtualStackArgs) {
    this.mwsRepo = mwsRepo;
    this.preStack = preStack || [];
  }

  createBolt(args: {
    stack: string[];
    req: Request;
    res: Response;
    onDone: (a: { req: Request; res: Response; results: Record<string, any> }) => void;
  }): StackBolt {
    args.stack = this.preStack.concat(args.stack);
    return new StackBolt({ mwsRepo: this.mwsRepo, ...args });
  }
}
