import {StreamAdapter} from '@cycle/base';
import {makeHistoryDriver} from '@cycle/history';
import {History, HistoryDriverOptions} from '@cycle/history/lib/interfaces';

import {RouterSource} from './RouterSource';

export function makeRouterDriver(history: History, options?: HistoryDriverOptions) {
  const historyDriver = makeHistoryDriver(history, options);
  return function routerDriver(sink$: any, runSA: StreamAdapter) {
    const history$ = historyDriver(sink$, runSA);
    return new RouterSource(history$, [], history$.createHref);
  };
}
