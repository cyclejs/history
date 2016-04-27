import {makeHistoryDriver} from '@cycle/history';
import {History, HistoryDriverOptions} from '@cycle/history/lib/interfaces';

import {RouterSource} from './RouterSource';

export function makeRouterDriver(history: History, options?: HistoryDriverOptions) {
  return function routerDriver(sink$: any) {
    const history$ = makeHistoryDriver(history, options);
    return new RouterSource(history$, [], (<any> history$).createHref);
  };
}
