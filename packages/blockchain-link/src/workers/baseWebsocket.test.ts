import { BaseWebsocket } from './baseWebsocket';

class TestWebsocket extends BaseWebsocket<{ block: unknown }> {}

describe('BaseWebsocket', () => {
    describe('onPing', () => {
        const createApi = () => {
            const api = new TestWebsocket({ url: 'ws://localhost:1' });
            const disconnect = jest.spyOn(api, 'disconnect').mockResolvedValue(undefined);
            const ping = jest.spyOn(api as any, 'ping').mockResolvedValue(undefined);

            return { api, disconnect, ping };
        };

        it('pings instead of disconnecting while a request is in flight', async () => {
            const { api, disconnect, ping } = createApi();
            // No subscriptions and no keepAlive - the pending request alone has to keep the socket
            // alive, otherwise a slow push is hung up on before it can be answered.
            const { promiseId } = (api as any).messages.create(0);

            try {
                await api.onPing();

                expect(ping).toHaveBeenCalled();
                expect(disconnect).not.toHaveBeenCalled();
            } finally {
                (api as any).messages.resolve(promiseId, undefined);
            }
        });

        it('still disconnects a genuinely idle socket', async () => {
            const { api, disconnect, ping } = createApi();

            await api.onPing();

            expect(ping).not.toHaveBeenCalled();
            expect(disconnect).toHaveBeenCalled();
        });
    });
});
