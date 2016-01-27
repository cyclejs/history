/* global require */
const assert = require(`assert`)
const Rx = require(`rx`)
const {
  makeHistoryDriver,
  makeServerHistoryDriver,
} = require(`../src/index`)

const statelessUrl$ = Rx.Observable.from([
  `/home`,
  `/home/profile`,
  `/`,
  `/about`,
])

const statefulUrl$ = Rx.Observable.from([
  {state: {y: 400}, path: `/home`},
  {state: {y: 350}, path: `/home/profile`},
  {state: {y: 0}, path: `/`},
  {state: {y: 1000}, path: `/about?x=99`},
])

const mixedStateUrl$ = Rx.Observable.from([
  `/home`,
  `/home/profile`,
  {state: {y: 0}, path: `/`},
  `/about`,
])

describe(`makeHistoryDriver`, () => {
  it(`should return a function`, () => {
    assert.strictEqual(typeof makeHistoryDriver({}), `function`)
  })

  it(`should accept no parameter`, () => {
    assert.doesNotThrow(() => {
      makeHistoryDriver({hash: true})
    })
  })

  it(`should accept an options object`, () => {
    assert.doesNotThrow(() => {
      makeHistoryDriver({
        hash: true,
        queries: true,
        basename: `home`,
      })
    })
  })

  it('should ignore primitives', () => {
    assert.doesNotThrow(() => {
      makeHistoryDriver(`hello`)
      makeHistoryDriver([])
      makeHistoryDriver(true)
    })
  })

  describe(`historyDriver`, () => {
    it('should accept an observable', () => {
      assert.doesNotThrow(() => {
        makeHistoryDriver({hash: true})(statelessUrl$)
      })
    })

    it('should acceept all types of observables', () => {
      assert.doesNotThrow(() => {
        makeHistoryDriver({hash: true})(statelessUrl$)
        makeHistoryDriver({hash: true})(statefulUrl$)
        makeHistoryDriver({hash: true})(mixedStateUrl$)
      })
    })

    it('should return an Rx.BehaviorSubject', () => {
      assert.strictEqual(
        makeHistoryDriver({hash: true})(mixedStateUrl$) instanceof Rx.BehaviorSubject,
        true
      )
    })
  })

  describe(`historySubject`, () => {
    it('should return a location object', done => {
      const historySubject = makeHistoryDriver({
        hash: true,
        queries: true,
        basename: `/home`,
      })(statefulUrl$)

      historySubject
        .skip(1)
        .take(1)
        .subscribe(location => {
          assert.strictEqual(typeof location, `object`)
          assert.strictEqual(location.pathname, `/about`)
          assert.strictEqual(location.search, `?x=99`)
          assert.strictEqual(typeof location.query, `object`)
          assert.strictEqual(location.query.x, `99`)
          assert.strictEqual(typeof location.state, `object`)
          assert.strictEqual(location.state.y, 1000)
          assert.strictEqual(location.action, `POP`)
          assert.strictEqual(typeof location.key, `string`)
          done()
        })
    })
  })
})

const serverConfig = {
  pathname: `/about`,
  query: {x: `99`},
  search: `?x=99`,
  state: {y: 1000},
  action: `PUSH`,
  key: ``,
}

describe(`makeServerHistoryDriver`, () => {
  it('should return a function', () => {
    assert.strictEqual(typeof makeServerHistoryDriver(serverConfig), `function`)
  })

  it('should return defaults', () => {
    assert.doesNotThrow(() => {
      makeServerHistoryDriver()
    })
  })

  describe('serverHistorySubject', done => {
    it ('should return a location object', () => {
      const historySubject = makeServerHistoryDriver(serverConfig)()

      historySubject
        .subscribe(location => {
          assert.strictEqual(typeof location, `object`)
          assert.strictEqual(location.pathname, `/about`)
          assert.strictEqual(location.search, `?x=99`)
          assert.strictEqual(typeof location.query, `object`)
          assert.strictEqual(location.query.x, `99`)
          assert.strictEqual(typeof location.state, `object`)
          assert.strictEqual(location.state.y, 1000)
          assert.strictEqual(location.action, `PUSH`)
          assert.strictEqual(typeof location.key, `string`)
        })
    })
  })
})
