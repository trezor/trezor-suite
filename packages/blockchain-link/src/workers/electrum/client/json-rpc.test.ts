import { BatchingJsonRpcClient } from './batching';
import { JsonRpcClient } from './json-rpc';

// The Electrum server is an untrusted, user-selectable backend (including custom
// addresses). Data arrives line-delimited and is JSON.parse-d inside a synchronous
// socket 'data' listener, so a malformed line must be dropped rather than throwing
// out of the listener (which would become an uncaughtException and crash the worker).
describe('Electrum JsonRpcClient malformed-message handling', () => {
    it('does not throw when a received line is not valid JSON', () => {
        const client = new JsonRpcClient();

        expect(() => client.onReceive('this is not json\n')).not.toThrow();
        expect(() => client.onReceive('{ broken\n')).not.toThrow();
        // a bare non-JSON token (e.g. a stray keep-alive line)
        expect(() => client.onReceive('\x00\x01\x02\n')).not.toThrow();
    });

    it('still delivers a valid notification that follows a malformed line', () => {
        const client = new JsonRpcClient();
        const listener = jest.fn();
        client.on('blockchain.headers.subscribe', listener);

        // one malformed line, then a valid JSON-RPC notification, in a single chunk
        client.onReceive(
            'garbage}{\n' +
                JSON.stringify({
                    jsonrpc: '2.0',
                    method: 'blockchain.headers.subscribe',
                    params: [{ height: 1 }],
                }) +
                '\n',
        );

        expect(listener).toHaveBeenCalledTimes(1);
        expect(listener).toHaveBeenCalledWith([{ height: 1 }]);
    });

    it('does not throw when a subscription handler is fed non-array/misshapen params', () => {
        const client = new JsonRpcClient();
        // Mirrors electrum.ts onBlock, which does `blocks.sort(...)` and throws on a non-array.
        client.on('blockchain.headers.subscribe', (blocks: any) => blocks.sort());

        // An untrusted server can send a notification whose params are an object, null,
        // a number or a string instead of the expected array.
        for (const params of [{}, null, 42, 'oops']) {
            expect(() =>
                client.onReceive(
                    JSON.stringify({
                        jsonrpc: '2.0',
                        method: 'blockchain.headers.subscribe',
                        params,
                    }) + '\n',
                ),
            ).not.toThrow();
        }
    });

    it('does not throw when a whole received line is a bare JSON null', () => {
        const client = new JsonRpcClient();

        // `JSON.parse('null')` succeeds, so the parse guard passes it through; destructuring
        // null in response() would throw without the dispatch guard.
        expect(() => client.onReceive('null\n')).not.toThrow();
    });

    it('BatchingJsonRpcClient also drops malformed lines without throwing', () => {
        const client = new BatchingJsonRpcClient();
        const listener = jest.fn();
        client.on('blockchain.headers.subscribe', listener);

        expect(() =>
            client.onReceive(
                'not json\n' +
                    JSON.stringify({
                        jsonrpc: '2.0',
                        method: 'blockchain.headers.subscribe',
                        params: [{ height: 2 }],
                    }) +
                    '\n',
            ),
        ).not.toThrow();
        expect(listener).toHaveBeenCalledWith([{ height: 2 }]);
    });
});
