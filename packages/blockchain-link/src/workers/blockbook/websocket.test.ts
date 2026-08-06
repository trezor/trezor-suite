import { BlockbookAPI } from './websocket';

describe('BlockbookAPI', () => {
    describe('pushTransaction', () => {
        it('applies its own timeout instead of the default deadline', async () => {
            const api = new BlockbookAPI({ url: 'ws://localhost:1' });
            const sendMessage = jest
                .spyOn(api, 'sendMessage')
                .mockResolvedValue({ result: '0xdead' });

            await expect(api.pushTransaction('0x0102', true)).resolves.toEqual({
                result: '0xdead',
            });
            expect(sendMessage).toHaveBeenCalledWith(
                {
                    method: 'sendTransaction',
                    params: { hex: '0x0102', disableAlternativeRPC: true },
                },
                { timeout: 110_000 },
            );
        });
    });

    describe('onPing', () => {
        const createApi = () => {
            const api = new BlockbookAPI({ url: 'ws://localhost:1' });
            const disconnect = jest.spyOn(api, 'disconnect').mockResolvedValue(undefined);
            const ping = jest
                .spyOn(api as any, 'ping')
                .mockResolvedValue(undefined) as jest.SpyInstance;

            return { api, disconnect, ping };
        };

        it('pings instead of disconnecting while a request is in flight', async () => {
            const { api, disconnect, ping } = createApi();
            // no subscriptions, no keepAlive - only the pending request keeps the socket alive
            const { promiseId } = (api as any).messages.create(60_000);

            await api.onPing();

            expect(ping).toHaveBeenCalled();
            expect(disconnect).not.toHaveBeenCalled();
            (api as any).messages.resolve(promiseId, undefined);
        });

        it('still disconnects a genuinely idle socket', async () => {
            const { api, disconnect, ping } = createApi();

            await api.onPing();

            expect(ping).not.toHaveBeenCalled();
            expect(disconnect).toHaveBeenCalled();
        });
    });
});
