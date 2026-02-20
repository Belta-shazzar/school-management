import fileLoader from './_common/fileLoader';

export default class MongoLoader {
  private schemaExtension: string;

  constructor({ schemaExtension }: { schemaExtension: string }) {
    this.schemaExtension = schemaExtension;
  }

  load(): Record<string, any> {
    const models = fileLoader(`./src/managers/entities/**/*.${this.schemaExtension}`);
    // Each loaded module might use default export
    const resolved: Record<string, any> = {};
    Object.keys(models).forEach((key) => {
      resolved[key] = models[key].default || models[key];
    });
    return resolved;
  }
}
