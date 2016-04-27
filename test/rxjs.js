/* eslint max-nested-callbacks: 0 */
/*global describe, it */
import assert from 'assert'
import * as Rx from 'rxjs';
import RxJSAdapter from '@cycle/rxjs-adapter'
import Cycle from '@cycle/rxjs-run'
import {makeRouterDriver, createServerHistory} from '../lib'

describe('Cyclic Router - RxJS 5 -', () => {
  describe('makeRouterDriver', () => {
    it('should throw if not given a history instance', () => {
      assert.throws(() => {
        makeRouterDriver(null)
      }, Error,
      /First argument to makeRouterDriver must be a valid history driver/i)
    })

    describe('routerDriver', () => {
      it('should return an object with `path` `define` `history$` ' +
        '`createHref`',
        () => {
          const history = createServerHistory()
          const router = makeRouterDriver(history)(Rx.Observable.of('/'), RxJSAdapter)
          assert.notStrictEqual(router.path, null)
          assert.strictEqual(typeof router.path, 'function')
          assert.notStrictEqual(router.define, null)
          assert.strictEqual(typeof router.define, 'function')
          assert.notStrictEqual(router.history$, null)
          assert.strictEqual(typeof router.history$, 'object')
          assert.strictEqual(typeof router.history$.subscribe, 'function')
          assert.notStrictEqual(router.createHref, null)
          assert.strictEqual(typeof router.createHref, 'function')
        })
    })
  })

  describe('path()', () => {
    it('should return an object with `path` `define` `history$` ' +
      '`createHref`',
      () => {
        const history = createServerHistory()
        const router = makeRouterDriver(history)(Rx.Observable.of('/'), RxJSAdapter)
          .path('/')
        assert.notStrictEqual(router.path, null)
        assert.strictEqual(typeof router.path, 'function')
        assert.notStrictEqual(router.define, null)
        assert.strictEqual(typeof router.define, 'function')
        assert.notStrictEqual(router.history$, null)
        assert.strictEqual(typeof router.history$, 'object')
        assert.strictEqual(typeof router.history$.subscribe, 'function')
        assert.notStrictEqual(router.createHref, null)
        assert.strictEqual(typeof router.createHref, 'function')
      })

    it('should filter the history$', () => {
      const routes = [
        '/somewhere/else',
        '/path/that/is/correct',
      ]
      const history = createServerHistory()
      const router = makeRouterDriver(history)(Rx.Observable.from(routes), RxJSAdapter)
        .path('/path')

      router.history$.subscribe({
        next: (location) => {
          assert.notStrictEqual(location.pathname, '/somewhere/else')
          assert.strictEqual(location.pathname, '/path/that/is/correct')
        },
        error: () => {},
        complete: () => {}
      })
    })

    it('multiple path()s should filter the history$', () => {
      const routes = [
        '/the/wrong/path',
        '/some/really/really/deeply/nested/route/that/is/correct',
        '/some/really/really/deeply/nested/incorrect/route',
      ]

      const history = createServerHistory()
      const router = makeRouterDriver(history)(Rx.Observable.from(routes), RxJSAdapter)
        .path('/some').path('/really').path('/really').path('/deeply')
        .path('/nested').path('/route').path('/that')

      router.history$.subscribe({
        next: ({pathname}) => {
          assert.strictEqual(pathname,
            '/some/really/really/deeply/nested/route/that/is/correct')
        },
        error: () => {},
        complete: () => {},
      })
    })

    it('should create a proper path using createHref()', () => {
      const routes = [
        '/the/wrong/path',
        '/some/really/really/deeply/nested/route/that/is/correct',
        '/some/really/really/deeply/nested/incorrect/route',
      ]

      const history = createServerHistory()
      const router = makeRouterDriver(history)(Rx.Observable.from(routes), RxJSAdapter)
        .path('/some').path('/really').path('/really').path('/deeply')
        .path('/nested').path('/route').path('/that')

      router.history$.subscribe({
        next: ({pathname}) => {
          assert.strictEqual(pathname,
            '/some/really/really/deeply/nested/route/that/is/correct')
          assert.strictEqual(
            router.createHref('/is/correct'),
            '/some/really/really/deeply/nested/route/that/is/correct')
        },
        error: () => {},
        complete: () => {}
      })
    })
  })

  describe('define()', () => {
    it('should return a stream',
      () => {
        const history = createServerHistory()
        const router = makeRouterDriver(history)(Rx.Observable.of('/'), RxJSAdapter).define({})
        assert.strictEqual(router instanceof Rx.Observable, true)
        assert.strictEqual(typeof router.subscribe, 'function')
        assert.notStrictEqual(router.createHref, null)
        assert.strictEqual(typeof router.createHref, 'function')
      })

    it('should match routes against a definition object', done => {
      const definition = {
        '/some': {
          '/route': 123,
        },
      }

      const routes = [
        '/some/route',
      ]

      const app = () => ({
        router: Rx.Observable.from(routes)
      })

      const history = createServerHistory()
      const {sources, run} = Cycle(app, {
        router: makeRouterDriver(history)
      })

      sources.router.define(definition).subscribe({
        next: ({path, value, location}) => {
          assert.strictEqual(path, '/some/route')
          assert.strictEqual(value, 123)
          assert.strictEqual(location.pathname, '/some/route')
          done()
        },
        error: () => {},
        complete: () => {}
      })

      run();
    })

    it('should respect prior filtering by path()', done => {
      const definition = {
        '/correct': {
          '/route': 123,
        },
      }

      const routes = [
        '/wrong/path',
        '/some/nested/correct/route',
      ]

      const history = createServerHistory()
      const router = makeRouterDriver(history)(Rx.Observable.from(routes), RxJSAdapter)
      const match$ = router.path('/some').path('/nested').define(definition)

      match$.subscribe({
        next: ({path, value, location}) => {
          assert.strictEqual(path, '/correct/route')
          assert.strictEqual(value, 123)
          assert.strictEqual(location.pathname, '/some/nested/correct/route')
          done()
        },
        error: () => {},
        complete: () => {},
      })
    })

    it('should match a default route if one is not found', done => {
      const definition = {
        '/correct': {
          '/route': 123,
        },
        '*': 999,
      }

      const routes = [
        '/wrong/path',
        '/wrong/route',
        '/some/nested/incorrect/route',
      ]

      const history = createServerHistory()
      const router = makeRouterDriver(history)(Rx.Observable.from(routes), RxJSAdapter)
      const match$ = router.path('/some').path('/nested').define(definition)

      match$.subscribe({
        next: ({path, value, location}) => {
          assert.strictEqual(path, '/incorrect/route')
          assert.strictEqual(value, 999)
          assert.strictEqual(location.pathname, '/some/nested/incorrect/route')
          done()
        },
        error: () => {},
        complete: () => {},
      })
    })

    it('should create a proper href using createHref()', done => {
      const defintion = {
        '/correct': {
          '/route': 123,
        },
        '*': 999,
      }

      const routes = [
        '/wrong/path',
        '/some/nested/correct/route',
      ]

      const history = createServerHistory()
      const router = makeRouterDriver(history)(Rx.Observable.from(routes), RxJSAdapter)
      const match$ = router
          .path('/some').path('/nested').define(defintion)

      match$.subscribe({
        next: ({location: {pathname}, createHref}) => {
          assert.strictEqual(pathname, '/some/nested/correct/route')
          assert.strictEqual(createHref('/correct/route'), pathname)
          done()
        },
        error: () => {},
        complete: () => {},
      })
    })

    it('should match partials', done => {
      const defintion = {
        '/correct': {
          '/route': 123,
        },
        '*': 999,
      }

      const routes = [
        '/wrong/path',
        '/some/nested/correct/route/partial',
      ]

      const history = createServerHistory()
      const router = makeRouterDriver(history)(Rx.Observable.from(routes), RxJSAdapter)
      const match$ = router
          .path('/some').path('/nested').define(defintion)

      match$.subscribe({
        next: ({path, location: {pathname}}) => {
          assert.strictEqual(path, '/correct/route')
          assert.strictEqual(pathname, '/some/nested/correct/route/partial')
          done()
        },
        error: () => {},
        complete: () => {},
      })
    })
  })
})
