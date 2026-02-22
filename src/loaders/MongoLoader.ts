import path from 'path';
import fileLoader from './_common/fileLoader';

export default class MongoLoader {
  private schemaExtension: string;

  constructor({ schemaExtension }: { schemaExtension: string }) {
    this.schemaExtension = schemaExtension;
  }

  load(): Record<string, any> {
    // When running the compiled output, __dirname is inside dist/loaders/.
    // Load compiled .js models from dist/; otherwise load .ts source files from src/.
    const isCompiled = __dirname.split(path.sep).includes('dist');
    const basePath = isCompiled ? './dist' : './src';
    const ext = isCompiled
      ? this.schemaExtension.replace(/\.ts$/, '.js')
      : this.schemaExtension;

    const models = fileLoader(`${basePath}/managers/entities/**/*.${ext}`);
    const resolved: Record<string, any> = {};
    Object.keys(models).forEach((key) => {
      resolved[key] = models[key].default || models[key];
    });
    return resolved;
  }
}
