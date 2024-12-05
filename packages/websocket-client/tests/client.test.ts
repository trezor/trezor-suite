import { WebsocketClient } from '../src/client';

class Cli extends WebsocketClient<{ 'foo-event': 'bar-event' }> {
    createWebsocket() {
        return this.initWebsocket(this.options);
    }
    ping() {
        return Promise.resolve();
    }

    sendMessage(_message: Record<string, any>) {
        return Promise.resolve({ success: true });
    }
}

describe('WebsocketClient', () => {
    it('throws error on connection', async () => {
        const cli = new Cli({ url: 'invalid-url' });

        await expect(() => cli.connect()).rejects.toThrow('invalid-url');

        // types check:

        cli.on('foo-event', event => {
            if (event === 'bar-event') {
                //
            }
        });
        const resp = await cli.sendMessage({ foo: 'bar' });
        if (resp.success) {
            expect(resp).toEqual({ success: true });
        } else {
            expect(resp).toEqual({ success: false });
        }
    });
});
