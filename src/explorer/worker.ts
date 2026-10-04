/**
 * Web Worker: runs the simulation off the main thread so the page stays
 * responsive. Requests go through the shared scheduler, which keeps only the
 * newest request of each kind and works one simulated year at a time, so a
 * new choice is picked up within about one year's computation.
 */
import { Scheduler, type Request, type Response } from './protocol';

const scheduler = new Scheduler(
  (r: Response) => self.postMessage(r),
  (fn) => setTimeout(fn, 0),
);

self.onmessage = (event: MessageEvent<Request>) => {
  scheduler.submit(event.data);
};

const ready: Response = { kind: 'ready' };
self.postMessage(ready);
