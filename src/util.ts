function splitPath(path: string): string[] {
  return path.split('/').filter(p => p.length > 0);
}

function filterPath(pathParts: string[], namespace: string[]): string {
  return pathParts.filter(part => namespace.indexOf(part) < 0).join('/');
}

const startsWith = (param: string, value: string) => param[0] === value;

const startsWith2 = (param: string, value1: string, value2: string) =>
  param[0] === value1 && param[1] === value2;

function makeCreateHref(namespace: string[], _createHref: Function): Function {
  return function createHref(path: string): string {
    const fullPath = `${namespace.join('/')}${path}`;
    return startsWith(fullPath, '/') || startsWith2(fullPath, '#', '/') ?
      _createHref(fullPath) :
      _createHref('/' + fullPath);
  };
}

export {
  splitPath,
  filterPath,
  makeCreateHref,
}
