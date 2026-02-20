import path from 'path';
import { glob } from 'glob';

/**
 * Load files matching a glob pattern and return them as a keyed object.
 * Key = filename without extension prefix (before first dot).
 */
const fileLoader = (pattern: string): Record<string, any> => {
  const files = glob.sync(pattern);
  const modules: Record<string, any> = {};
  files.forEach((p: string) => {
    const key = p.split('/').pop()!.split('.').shift()!;
    modules[key] = require(path.resolve(p));
  });
  return modules;
};

export default fileLoader;
