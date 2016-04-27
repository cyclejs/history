import {Location, Pathname} from '@cycle/history/lib/interfaces';

import switchPath, {RouteDefinitions} from 'switch-path';
import {splitPath, makeCreateHref, filterPath} from './util';

function isInScope(namespace: string[], path: string): boolean {
  const pathParts = splitPath(path);
  return namespace.every((v, i) => pathParts[i] === v);
}

function filterPathName(pathname: Pathname, namespace: Pathname[]) {
  const pathParts = splitPath(pathname);
  return '/' + filterPath(pathParts, namespace);
}

export class RouterSource {
  constructor(public history$: any,
              private namespace: Array<Pathname>,
              private _createHref: (pathname: Pathname) => Pathname) {
  }

  path(pathname: Pathname) {
    const scopedNamespace = this.namespace.concat(pathname);
    const scopedHistory$ = this.history$
      .filter(({pathname}: Location) => isInScope(scopedNamespace, pathname));

    return new RouterSource(scopedHistory$, scopedNamespace, this._createHref);
  }

  define(routes: RouteDefinitions): any {
    const namespace = this.namespace;
    const createHref = makeCreateHref(namespace, this._createHref);
    let match$ = this.history$
      .debug()
      .map(({pathname}: Location) => {
        const filteredPath = filterPathName(pathname, namespace);
        const {path, value} = switchPath(filteredPath, routes);
        return {path, value, location, createHref};
      });

    match$.createHref = createHref;
    return match$;
  }

  createHref(path: Pathname): Pathname {
    return makeCreateHref(this.namespace, this._createHref)(path);
  }
}
