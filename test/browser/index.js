import * as assert from 'assert';

import {makeDOMDriver, h} from '@cycle/dom';
import {createHistory, createHashHistory} from 'history';
import {
  makeHistoryDriver,
  createServerHistory,
  createLocation,
  supportsHistory
} from '../../lib/index';

import xs from 'xstream';
import CycleXStream from '@cycle/xstream-run';
import XSAdapter from '@cycle/xstream-adapter';

const xsInterface = {
  Cycle: CycleXStream,
  Adapter: XSAdapter,
  of: x => xs.of(x),
  skip: stream => stream.drop(1),
  name: 'XStream',
  StreamType: xs,
}

import CycleMost from '@cycle/most-run'
import MostAdapter from '@cycle/most-adapter'
import most from 'most'

const mostInterface = {
  Cycle: CycleMost,
  Adapter: MostAdapter,
  of: x => most.of(x),
  skip: stream => stream.skip(1),
  name: 'Most',
  StreamType: most.Stream,
}

import CycleRxJS from '@cycle/rxjs-run'
import RxJSAdapter from '@cycle/rxjs-adapter'
import RxJS from 'rxjs'

const rxjsInterface = {
  Cycle: CycleRxJS,
  Adapter: RxJSAdapter,
  of: x => RxJS.Observable.of(x),
  skip: stream => stream.skip(1),
  name: 'Rx 5',
  StreamType: RxJS.Observable
}

import CycleRx from '@cycle/rx-run'
import RxAdapter from '@cycle/rx-adapter'
import Rx from 'rx'

const rxInterface = {
  Cycle: CycleRx,
  Adapter: RxAdapter,
  of: x => Rx.Observable.of(x),
  skip: stream => stream.skip(1),
  name: 'Rx 4',
  StreamType: Rx.Observable
}

const interfaces = [
  xsInterface,
  mostInterface,
  rxjsInterface,
  rxInterface
]

const locationDefaults = {
  pathname: '/',
  action: 'POP',
  hash: '',
  search: '',
  state: null,
  key: null,
  query: null,
};

function createRenderTarget(id = null) {
  let element = document.createElement(`div`);
  element.className = `cycletest`;
  if (id) {
    element.id = id;
  }
  document.body.appendChild(element);
  return element;
};

describe('History', () => {

  describe('createLocation', () => {
    it(`should return a full location with no parameter`, () => {
      assert.deepEqual(createLocation(), locationDefaults);
    });

    it(`should accept just a string as the pathname`, () => {
      assert.deepEqual(createLocation(`/`), locationDefaults);
    });

    it(`should accept an object of location parameters`, () => {
      const location = createLocation({pathname: `/some/path`, state: {the: `state`}});
      const refLocattion = Object.assign(locationDefaults, {
        pathname: `/some/path`, state: {the: `state`},
      });

      assert.deepEqual(location, refLocattion);
    });
  });

  describe(`supportsHistory`, () => {
    it(`should return true if the browser supports history API`, () => {
      assert.strictEqual(supportsHistory(), true);
    });
  });

  interfaces.forEach(({of, name, Cycle, Adapter, StreamType, skip}, i) => {

    describe(`historyDriver ~ ${name}`, () => {
      it(`should throw if not given a valid history object`, () => {
        assert.throws(() => {
          makeHistoryDriver();
        }, TypeError);
      });

      it(`should return a stream with createHref() and createLocation() methods`,
        () => {
          const history = createHistory();
          const history$ = makeHistoryDriver(history)(of(`/`), Adapter);

          assert.strictEqual(history$ instanceof StreamType, true);
          assert.strictEqual(typeof history$.createHref, `function`);
          assert.strictEqual(typeof history$.createLocation, `function`);
        });

      it('should allow pushing to a history object', (done) => {
        const history = createHistory();
        const app = () => ({})
        const {sources, run} = Cycle(app, {
          history: makeHistoryDriver(history)
        })

        let dispose;
        Adapter.streamSubscribe(skip(sources.history), {
          next(location) {
            assert.strictEqual(location.pathname, '/test');
            setTimeout(() => {
              try {
                dispose()
                done()
              } catch (e) {
                done();
              }
            })
          },
          error: () => {},
          complete: () => {}
        })
        dispose = run();

        history.push('/test')
      })

      it(`should return a location to application`, (done) => {
        const app = () => ({history: of(`/`)});
        const {sources, run} = Cycle(app, {
          history: makeHistoryDriver(createHistory()),
        });

        let dispose;
        Adapter.streamSubscribe(skip(sources.history), {
          next: (location) => {
            assert.strictEqual(typeof location, `object`);
            assert.strictEqual(location.pathname, `/`);
            assert.strictEqual(location.state, null);
            setTimeout(() => {
              dispose();
              done();
            });
          },
          error() { return void 0; },
          complete() { return void 0; },
        });
        dispose = run();
      });

      it(`should allow replacing a location`, (done) => {
        const app = () => ({
          history: of({
            type: `replace`,
            pathname: `/`,
          }),
        });
        const {sources, run} = Cycle(app, {
          history: makeHistoryDriver(createHistory()),
        });

        let dispose;
        Adapter.streamSubscribe(skip(sources.history), {
          next(location) {
            assert.strictEqual(typeof location, `object`);
            assert.strictEqual(location.pathname, `/`);
            assert.strictEqual(location.state, null);
            setTimeout(() => {
              dispose();
              done();
            });
          },
          error() { return void 0; },
          complete() { return void 0; },
        });
        dispose = run();
      });
    });
  })
});
