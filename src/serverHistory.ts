import {History, Listener, Location, Pathname} from './interfaces';

import {createLocation} from './util';

class ServerHistory implements History {
  private listeners: Array<Listener>;
  private _completeCallback: () => void;

  constructor(private currentLocation: Location) {
    this.listeners = [];
  }

  listen(listener: Listener) {
    this.listeners.push(listener);
    return function noop(): void { return void 0; };
  }

  push(location: Location | Pathname) {
    const length = this.listeners.length;
    if (length === 0) {
      throw new Error('Must be given at least one listener before pushing');
    }
    this.currentLocation = createLocation(location);
    for (let i = 0; i < length; ++i) {
      this.listeners[i](createLocation(location));
    }
  }

  replace(location: Location) {
    this.push(location);
  }

  createHref(path: Pathname) {
    return path;
  }

  createLocation(location: Location | Pathname) {
    return createLocation(location);
  }

  addCompleteCallback(complete: () => void) {
    this._completeCallback = complete;
  }

  complete() {
    this._completeCallback();
  }

  getCurrentLocation() {
    return this.currentLocation;
  }
}

export function createServerHistory(currentLocation: Location | Pathname): History {
  if (currentLocation === void 0) {
    throw new Error('ServerHistory needs an initial location passed in as a parameter');
  }
  return new ServerHistory(createLocation(currentLocation));
}
