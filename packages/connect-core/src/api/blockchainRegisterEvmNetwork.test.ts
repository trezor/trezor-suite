import BlockchainRegisterEvmNetwork from './blockchainRegisterEvmNetwork';
import { reconnectAllBackends, setCustomBackend } from '../backend/BlockchainLink';
import type { MethodMessage } from '../core/AbstractMethod';
import { getCoinInfoOrThrow } from '../data/coinInfo';

jest.mock('../backend/BlockchainLink', () => ({
    reconnectAllBackends: jest.fn(),
    setCustomBackend: jest.fn(),
}));

const validPayload = {
    method: 'blockchainRegisterEvmNetwork' as const,
    symbol: 'evm146',
    name: 'Sonic',
    chainId: 146,
    rpcUrls: ['https://rpc.soniclabs.com'],
};

const createMethod = (payload: object) =>
    new BlockchainRegisterEvmNetwork({
        payload: { ...validPayload, ...payload },
    } as MethodMessage<'blockchainRegisterEvmNetwork'>);

describe('BlockchainRegisterEvmNetwork', () => {
    beforeEach(() => {
        jest.clearAllMocks();
        jest.mocked(reconnectAllBackends).mockResolvedValue([]);
    });

    describe('params validation', () => {
        it('accepts a valid payload without a device', () => {
            const method = createMethod({ testnet: true });

            expect(method.useDevice).toBe(false);
            expect(method.requiredPermissions).toEqual([{ permission: 'internal' }]);
        });

        it.each([
            ['an empty symbol', { symbol: '' }],
            ['a non-string symbol', { symbol: 146 }],
            ['an empty name', { name: '' }],
            ['a zero chain id', { chainId: 0 }],
            ['a negative chain id', { chainId: -1 }],
            ['a fractional chain id', { chainId: 1.5 }],
            ['a string chain id', { chainId: '146' }],
            ['no RPC URLs', { rpcUrls: [] }],
            ['RPC URLs that are not an array', { rpcUrls: 'https://rpc.soniclabs.com' }],
            ['an RPC URL that is not a string', { rpcUrls: [1] }],
            ['an RPC URL that is not a URL', { rpcUrls: ['not a url'] }],
            ['an RPC URL with an unsupported protocol', { rpcUrls: ['file:///etc/passwd'] }],
            ['a non-boolean testnet flag', { testnet: 'yes' }],
        ])('rejects %s', (_, payload) => {
            expect(() => createMethod(payload)).toThrow();
        });

        it('rejects a payload with a missing parameter', () => {
            const { rpcUrls: _rpcUrls, ...payload } = validPayload;

            expect(
                () =>
                    new BlockchainRegisterEvmNetwork({
                        payload,
                    } as MethodMessage<'blockchainRegisterEvmNetwork'>),
            ).toThrow();
        });
    });

    describe('run', () => {
        it('registers the network and returns its symbol', async () => {
            const result = await createMethod({ symbol: 'evm201', chainId: 201 }).run();

            expect(result).toEqual({ symbol: 'evm201' });
            expect(getCoinInfoOrThrow('evm201')).toMatchObject({
                chainId: 201,
                blockchainLink: { type: 'evm-rpc', url: ['https://rpc.soniclabs.com'] },
            });
            expect(setCustomBackend).not.toHaveBeenCalled();
            expect(reconnectAllBackends).not.toHaveBeenCalled();
        });

        it('leaves the backends alone when the same network is registered again', async () => {
            const payload = { symbol: 'evm202', chainId: 202 };
            await createMethod(payload).run();
            await createMethod({ ...payload, name: 'Renamed' }).run();

            expect(getCoinInfoOrThrow('evm202').name).toBe('Renamed');
            expect(setCustomBackend).not.toHaveBeenCalled();
            expect(reconnectAllBackends).not.toHaveBeenCalled();
        });

        it('reconnects the backends to the new URLs when they change', async () => {
            const payload = { symbol: 'evm203', chainId: 203 };
            await createMethod(payload).run();
            await createMethod({ ...payload, rpcUrls: ['https://rpc2.example.com'] }).run();

            const expectedLink = { type: 'evm-rpc', url: ['https://rpc2.example.com'] };
            const coinInfo = getCoinInfoOrThrow('evm203');
            expect(coinInfo.blockchainLink).toEqual(expectedLink);
            expect(setCustomBackend).toHaveBeenCalledWith(coinInfo, expectedLink);
            expect(reconnectAllBackends).toHaveBeenCalledWith(coinInfo);
        });

        it('still registers the network when the reconnection fails', async () => {
            jest.mocked(reconnectAllBackends).mockRejectedValue(new Error('Backend error'));
            const payload = { symbol: 'evm204', chainId: 204 };
            await createMethod(payload).run();

            await expect(
                createMethod({ ...payload, rpcUrls: ['https://rpc2.example.com'] }).run(),
            ).resolves.toEqual({ symbol: 'evm204' });
        });

        it('rejects a symbol of a bundled network', async () => {
            await expect(createMethod({ symbol: 'eth', chainId: 205 }).run()).rejects.toThrow(
                'already used by a bundled network',
            );
        });
    });
});
