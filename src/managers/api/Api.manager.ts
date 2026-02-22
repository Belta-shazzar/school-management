import { Request, Response, NextFunction } from 'express';
import getParamNames from './_common/getParamNames';
import logger from '../../libs/logger';

/**
 * Scans all managers for exposed methods
 * and makes them available through a handler middleware.
 */
export default class ApiHandler {
  private config: any;
  private cache: any;
  private cortex: any;
  private managers: any;
  private mwsRepo: any;
  private mwsExec: any;
  private prop: string;
  private exposed: Record<string, any>;
  private methodMatrix: Record<string, Record<string, string[]>>;
  private mwsStack: Record<string, string[]>;

  constructor({ config, cortex, cache, managers, mwsRepo, prop }: any) {
    this.config = config;
    this.cache = cache;
    this.cortex = cortex;
    this.managers = managers;
    this.mwsRepo = mwsRepo;
    this.mwsExec = this.managers.mwsExec;
    this.prop = prop;
    this.exposed = {};
    this.methodMatrix = {};
    this.mwsStack = {};
    this.mw = this.mw.bind(this);

    /** filter only the modules that have httpExposed */
    const exposedModules = Object.keys(this.managers).filter(
      (mk) => this.managers[mk][this.prop]
    );

    logger.debug('Registering HTTP-exposed managers', { modules: exposedModules });
    Object.keys(this.managers).forEach((mk) => {
      if (this.managers[mk][this.prop]) {
        this.methodMatrix[mk] = {};

        this.managers[mk][this.prop].forEach((i: string) => {
          /** creating the method matrix */
          let method = 'post';
          let fnName = i;
          if (i.includes('=')) {
            const frags = i.split('=');
            method = frags[0];
            fnName = frags[1];
          }
          if (!this.methodMatrix[mk][method]) {
            this.methodMatrix[mk][method] = [];
          }
          this.methodMatrix[mk][method].push(fnName);

          let params = getParamNames(this.managers[mk][fnName]);
          const paramsList = params.split(',').map((p: string) => {
            p = p.trim();
            p = p.replace('{', '');
            p = p.replace('}', '');
            return p;
          });

          /** building middlewares stack */
          paramsList.forEach((param: string) => {
            if (!this.mwsStack[`${mk}.${fnName}`]) {
              this.mwsStack[`${mk}.${fnName}`] = [];
            }
            if (param.startsWith('__')) {
              if (!this.mwsRepo[param]) {
                throw new Error(`Unable to find middleware ${param}`);
              } else {
                this.mwsStack[`${mk}.${fnName}`].push(param);
              }
            }
          });
        });
      }
    });
  }

  private async _exec({
    targetModule,
    fnName,
    data,
  }: {
    targetModule: any;
    fnName: string;
    data: any;
  }): Promise<any> {
    let result: any = {};
    try {
      result = await targetModule[fnName](data);
    } catch (err) {
      logger.error(`Manager function execution failed: ${fnName}`, { error: err });
      result = { error: `${fnName} failed to execute` };
    }
    return result;
  }

  /** middleware for executing APIs through HTTP */
  async mw(req: Request, res: Response, _next: NextFunction): Promise<any> {
    const method = req.method.toLowerCase();
    const moduleName = req.params.moduleName;
    const fnName = req.params.fnName;
    const moduleMatrix = this.methodMatrix[moduleName];

    /** validate module */
    if (!moduleMatrix) {
      return this.managers.responseDispatcher.dispatch(res, {
        ok: false,
        message: `module ${moduleName} not found`,
      });
    }

    /** validate method */
    if (!moduleMatrix[method]) {
      return this.managers.responseDispatcher.dispatch(res, {
        ok: false,
        message: `unsupported method ${method} for ${moduleName}`,
      });
    }

    if (!moduleMatrix[method].includes(fnName)) {
      return this.managers.responseDispatcher.dispatch(res, {
        ok: false,
        message: `unable to find function ${fnName} with method ${method}`,
      });
    }

    const targetStack = this.mwsStack[`${moduleName}.${fnName}`];

    const hotBolt = this.mwsExec.createBolt({
      stack: targetStack,
      req,
      res,
      onDone: async ({
        req: boltReq,
        res: boltRes,
        results,
      }: {
        req: Request;
        res: Response;
        results: Record<string, any>;
      }) => {
        /** executed after all middleware finished */
        const body = boltReq.body || {};
        let result = await this._exec({
          targetModule: this.managers[moduleName],
          fnName,
          data: {
            ...body,
            ...results,
            res: boltRes,
          },
        });
        if (!result) result = {};

        if (result.selfHandleResponse) {
          // do nothing if response handled
        } else {
          if (result.errors) {
            return this.managers.responseDispatcher.dispatch(boltRes, {
              ok: false,
              errors: result.errors,
            });
          } else if (result.error) {
            return this.managers.responseDispatcher.dispatch(boltRes, {
              ok: false,
              message: result.error,
            });
          } else {
            return this.managers.responseDispatcher.dispatch(boltRes, {
              ok: true,
              data: result,
            });
          }
        }
      },
    });

    hotBolt.run();
  }
}
