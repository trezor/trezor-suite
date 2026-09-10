import { EventEmitter } from 'events';

import { BlockbookAPI, PUSH_TRANSACTION_TIMEOUT } from './websocket';

const WEBSOCKET_OPEN = 1;
const WEBSOCKET_CLOSED = 3;

// A socket that accepts frames and never answers, so the only thing that can settle a request is
// its own deadline.
class SilentWebsocket extends EventEmitter {
    readyState = WEBSOCKET_OPEN;

    send() {}

    close() {
        this.readyState = WEBSOCKET_CLOSED;
        this.emit('close');
    }
}

const connect = async () => {
    const ws = new SilentWebsocket();
    class TestBlockbookAPI extends BlockbookAPI {
        protected createWebsocket() {
            return ws as any;
        }
    }

    const api = new TestBlockbookAPI({ url: 'ws://localhost:1' });
    const connected = api.connect();
    ws.emit('open');
    await connected;

    return { api, ws };
};

describe('BlockbookAPI', () => {
    beforeEach(() => {
        jest.useFakeTimers();
    });

    afterEach(() => {
        jest.useRealTimers();
    });

    describe('pushTransaction', () => {
        it('waits out blockbook instead of failing at the default deadline', async () => {
            const { api } = await connect();

            let outcome: string | undefined;
            api.pushTransaction('0x0102').then(
                () => {
                    outcome = 'resolved';
                },
                (error: Error) => {
                    outcome = error.message;
                },
            );

            // Past the 20s default deadline and past the ~70s at which the unanswered keep-alive
            // ping used to tear the whole socket down.
            await jest.advanceTimersByTimeAsync(PUSH_TRANSACTION_TIMEOUT - 10_000);
            expect(outcome).toBeUndefined();

            await jest.advanceTimersByTimeAsync(10_000);
            expect(outcome).toBe('Websocket timeout');

            api.dispose();
        });
    });
});
