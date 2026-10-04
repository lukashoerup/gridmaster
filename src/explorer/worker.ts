/**
 * Web Worker: runs the simulation off the main thread so the page stays
 * responsive while a year (or thirty-one of them) is computed.
 */
import { handle, type Request, type Response } from './protocol';

self.onmessage = (event: MessageEvent<Request>) => {
  handle(event.data, (response: Response) => {
    self.postMessage(response);
  });
};
