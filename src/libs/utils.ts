export const slugify = (text: string): string => {
  const from = 'ãàáäâẽèéëêìíïîõòóöôùúüûñç·/_,:;';
  const to = 'aaaaaeeeeeiiiiooooouuuunc------';

  const newText = text
    .split('')
    .map((letter, i) => letter.replace(new RegExp(from.charAt(i), 'g'), to.charAt(i)));

  return newText
    .toString()
    .toLowerCase()
    .trim()
    .replace(/\s+/g, '-')
    .replace(/&/g, '-y-')
    .replace(/[^\w\-]+/g, '')
    .replace(/\-\-+/g, '-');
};

export const upCaseFirst = (str: string): string => {
  return str.charAt(0).toUpperCase() + str.slice(1);
};

export const getDeepValue = (path: string, obj: any): any => {
  const parts = path.split('.');
  for (let i = 0; i < parts.length; i++) {
    const level = obj[parts[i]];
    if (!level) return null;
    obj = level;
  }
  return obj;
};

export const setDeepValue = ({
  path,
  value,
  obj,
  marker,
}: {
  path: string;
  value: any;
  obj: any;
  marker?: string;
}): any => {
  if (!marker) marker = '.';
  const pfs = path.split(marker);
  let deepRef = obj;

  for (let i = 0; i < pfs.length; i++) {
    if (deepRef[pfs[i]] === undefined || deepRef[pfs[i]] === null) {
      deepRef[pfs[i]] = {};
    }
    if (i === pfs.length - 1) {
      deepRef[pfs[i]] = value;
    } else {
      deepRef = deepRef[pfs[i]];
    }
  }
  return obj;
};

export default {
  slugify,
  upCaseFirst,
  getDeepValue,
  setDeepValue,
};
