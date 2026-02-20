import MiddlewaresLoader from './MiddlewaresLoader';
import ApiHandler from '../managers/api/Api.manager';
import UserServer from '../managers/http/UserServer.manager';
import ResponseDispatcher from '../managers/response_dispatcher/ResponseDispatcher.manager';
import VirtualStack from '../managers/virtual_stack/VirtualStack.manager';
import ValidatorsLoader from './ValidatorsLoader';
import MongoLoader from './MongoLoader';
import TokenManager from '../managers/token/Token.manager';
import UserManager from '../managers/entities/user/User.manager';
import SchoolManager from '../managers/entities/school/School.manager';
import ClassroomManager from '../managers/entities/classroom/Classroom.manager';
import StudentManager from '../managers/entities/student/Student.manager';
import schemaModels from '../managers/_common/schema.models';
import schemaValidators from '../managers/_common/schema.validators';
import utils from '../libs/utils';

export default class ManagersLoader {
  private managers: Record<string, any>;
  private config: any;
  private cache: any;
  private cortex: any;
  private validators: any;
  private mongomodels: any;
  private injectable: any;

  constructor({ config, cache, cortex }: { config: any; cache?: any; cortex?: any }) {
    this.managers = {};
    this.config = config;
    this.cache = cache;
    this.cortex = cortex;

    this._preload();
    this.injectable = {
      utils,
      cache,
      config,
      cortex,
      managers: this.managers,
      validators: this.validators,
      mongomodels: this.mongomodels,
    };
  }

  private _preload(): void {
    const validatorsLoader = new ValidatorsLoader({
      models: schemaModels,
      customValidators: schemaValidators,
    });

    const mongoLoader = new MongoLoader({ schemaExtension: 'mongoModel.ts' });

    this.validators = validatorsLoader.load();
    this.mongomodels = mongoLoader.load();
  }

  load(): Record<string, any> {
    this.managers.responseDispatcher = new ResponseDispatcher();

    const middlewaresLoader = new MiddlewaresLoader(this.injectable);
    const mwsRepo = middlewaresLoader.load();
    this.injectable.mwsRepo = mwsRepo;

    /***************************************** CUSTOM MANAGERS *****************************************/
    this.managers.token = new TokenManager(this.injectable);

    this.managers.user = new UserManager(this.injectable);
    this.managers.school = new SchoolManager(this.injectable);
    this.managers.classroom = new ClassroomManager(this.injectable);
    this.managers.student = new StudentManager(this.injectable);
    /*************************************************************************************************/

    this.managers.mwsExec = new VirtualStack({
      ...{ preStack: ['__device'] },
      ...this.injectable,
    });

    this.managers.userApi = new ApiHandler({
      ...this.injectable,
      ...{ prop: 'httpExposed' },
    });

    this.managers.userServer = new UserServer({
      config: this.config,
      managers: this.managers,
    });

    return this.managers;
  }
}
