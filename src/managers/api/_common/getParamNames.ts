/**
 * Takes a function and returns its parameter names as a comma-separated string.
 */
const STRIP_COMMENTS = /((\/\/.*$)|(\/\*[\s\S]*?\*\/))/gm;
const ARGUMENT_NAMES = /([^\s,]+)/g;

function getParamNames(func: Function): string {
  if (!func) {
    throw new Error('an exposed function not found.');
  }
  const fnStr = func.toString().replace(STRIP_COMMENTS, '');
  const result = fnStr
    .slice(fnStr.indexOf('(') + 1, fnStr.indexOf(')'))
    .match(ARGUMENT_NAMES);
  if (result === null) return '';
  return result.join(' , ');
}

export default getParamNames;
