import { EventEmitter } from 'events';

export type ThreadRequestType = 'init' | 'call' | 'subscribe' | 'unsubscribe';

export type ThreadRequest = {
    id: number;
    type: ThreadRequestType;
    payload: any;
};

export type ThreadResponse =
    | {
          id: number;
          success: true;
          payload: any;
      }
    | {
          id: number;
          success: false;
          error: string;
      };

export type ThreadEvent = {
    event: string;
    payload?: any;
};

const isValidThreadRequest = (req: any): req is ThreadRequest =>
    typeof req === 'object' && typeof req?.id === 'number' && typeof req.type === 'string';

export const isValidThreadResponse = (res: any): res is ThreadResponse =>
    typeof res === 'object' &&
    typeof res?.id === 'number' &&
    (res.success || typeof res.error === 'string');

export const isValidThreadEvent = (ev: any): ev is ThreadEvent =>
    typeof ev === 'object' && typeof ev?.event === 'string';

const respond = (id: number, payload: any = undefined) =>
    process.parentPort.postMessage({ id, payload, success: true });

const fail = (id: number, error: string) =>
    process.parentPort.postMessage({ id, error, success: false });

const fire = (event: string, payload: any) => process.parentPort.postMessage({ event, payload });

/**
 * Utility process helper. Use only in a file inside `suite-desktop/src/threads`.
 *
 * Creates event-emitter-like object in Electron's utility process and allows
 * to communicate with it by `call`, `subscribe` and `unsubscribe` messages.
 *
 * @param init 'Constructor' function which will create the object from parameters
 * received with `init` message
 */
export const createThread = <P, T extends EventEmitter>(init: (params: P) => T | Promise<T>) => {
    let obj: T;

    process.parentPort.on('message', async ({ data }) => {
        if (!isValidThreadRequest(data)) return;
        try {
            switch (data.type) {
                case 'init':
                    obj = await init(data.payload);

                    return respond(data.id);
                case 'call': {
                    const { method, params } = data.payload;
                    const result = await (obj as any)[method](...params);

                    return respond(data.id, result);
                }
                case 'subscribe': {
                    const { event } = data.payload;
                    if (!obj.listenerCount(event)) {
                        obj.on(event, payload => fire(event, payload));
                    }

                    return respond(data.id);
                }
                case 'unsubscribe': {
                    const { event } = data.payload;
                    obj.removeAllListeners(event);

                    return respond(data.id);
                }
                default:
                    break;
            }
        } catch (e) {
            return fail(data.id, e.message);
        }
    });
};
