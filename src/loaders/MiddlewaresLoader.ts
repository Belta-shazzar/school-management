import path from 'path';
import fileLoader from './_common/fileLoader';

export default class MiddlewaresLoader {
  private injectable: any;

  constructor(injectable: any) {
    this.injectable = injectable;
  }

  load(): Record<string, any> {
    const isCompiled = __dirname.split(path.sep).includes('dist');
    const mwGlob = isCompiled ? './dist/mws/**/*.mw.js' : './src/mws/**/*.mw.ts';
    const mws = fileLoader(mwGlob);
    Object.keys(mws).forEach((ik) => {
      /** call the mw builder — each mw file exports a factory function */
      const mod = mws[ik].default || mws[ik];
      mws[ik] = mod(this.injectable);
    });
    return mws;
  }
}
