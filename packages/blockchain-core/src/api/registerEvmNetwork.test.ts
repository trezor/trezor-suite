import { registerEvmNetwork } from './registerEvmNetwork';
import { reconnectAllBackends, setCustomBackend } from '../backend/BlockchainLink';
import { getBackendCoinInfo } from '../data/coinInfo';

jest.mock('../backend/BlockchainLink', () => ({
    reconnectAllBackends: jest.fn(),
    setCustomBackend: jest.fn(),
}));

const params = {
    symbol: 'evm146',
    name: 'Sonic',
    rpcUrls: ['https://rpc.soniclabs.com'],
};

describe(registerEvmNetwork.name, () => {
    beforeEach(() => {
        jest.clearAllMocks();
        jest.mocked(reconnectAllBackends).mockResolvedValue([]);
    });

    it.each([
        ['an empty symbol', { symbol: '' }],
        ['a missing name', { name: undefined }],
        ['an empty name', { name: '' }],
        ['no RPC URLs', { rpcUrls: [] }],
        ['RPC URLs that are not an array', { rpcUrls: 'https://rpc.soniclabs.com' }],
        ['an RPC URL that is not a string', { rpcUrls: [1] }],
        ['an RPC URL that is not a URL', { rpcUrls: ['not a url'] }],
        ['an RPC URL with an unsupported protocol', { rpcUrls: ['file:///etc/passwd'] }],
        ['a zero block time', { blockTimeSeconds: 0 }],
        ['a non-numeric block time', { blockTimeSeconds: 'fast' }],
    ])('rejects %s', async (_, override) => {
        await expect(
            registerEvmNetwork({ ...params, symbol: 'evm100', ...override } as typeof params),
        ).rejects.toThrow();
    });

    it('serves the network by its RPC URLs with fee levels of an EVM chain', async () => {
        await expect(registerEvmNetwork({ ...params, symbol: 'evm201' })).resolves.toEqual({
            symbol: 'evm201',
        });

        const coinInfo = getBackendCoinInfo('evm201');
        expect(coinInfo).toMatchObject({
            type: 'ethereum',
            name: 'Sonic',
            blockchainLink: { type: 'evm-rpc', url: ['https://rpc.soniclabs.com'] },
        });
        expect(coinInfo.defaultFees[0]).toMatchObject({ label: 'normal', feeLimit: '21000' });
        expect(coinInfo.maxFee).toBeGreaterThan(coinInfo.minFee);
        expect(setCustomBackend).not.toHaveBeenCalled();
    });

    it('derives the fee block time from the measured block time', async () => {
        await registerEvmNetwork({ ...params, symbol: 'evm206', blockTimeSeconds: 2.4 });

        expect(getBackendCoinInfo('evm206').blockTime).toBe(2);
    });

    it('falls back to the Ethereum block time when none was measured', async () => {
        await registerEvmNetwork({ ...params, symbol: 'evm207' });

        expect(getBackendCoinInfo('evm207').blockTime).toBe(12);
    });

    it('leaves the backends alone when the same network is registered again', async () => {
        await registerEvmNetwork({ ...params, symbol: 'evm202' });
        await registerEvmNetwork({ ...params, symbol: 'evm202', name: 'Renamed' });

        expect(getBackendCoinInfo('evm202').name).toBe('Renamed');
        expect(setCustomBackend).not.toHaveBeenCalled();
        expect(reconnectAllBackends).not.toHaveBeenCalled();
    });

    it('reconnects the backends to the new URLs when they change', async () => {
        await registerEvmNetwork({ ...params, symbol: 'evm203' });
        await registerEvmNetwork({
            ...params,
            symbol: 'evm203',
            rpcUrls: ['https://rpc2.example.com'],
        });

        const coinInfo = getBackendCoinInfo('evm203');
        const expectedLink = { type: 'evm-rpc', url: ['https://rpc2.example.com'] };
        expect(coinInfo.blockchainLink).toEqual(expectedLink);
        expect(setCustomBackend).toHaveBeenCalledWith(coinInfo, expectedLink);
        expect(reconnectAllBackends).toHaveBeenCalledWith(coinInfo);
    });

    it('still registers the network when the reconnection fails', async () => {
        jest.mocked(reconnectAllBackends).mockRejectedValue(new Error('Backend error'));
        await registerEvmNetwork({ ...params, symbol: 'evm204' });

        await expect(
            registerEvmNetwork({
                ...params,
                symbol: 'evm204',
                rpcUrls: ['https://rpc2.example.com'],
            }),
        ).resolves.toEqual({ symbol: 'evm204' });
    });

    it.each(['eth', 'ETH', 'btc', 'tarc'])('rejects the symbol %s of a predefined coin', symbol =>
        expect(registerEvmNetwork({ ...params, symbol })).rejects.toThrow(
            'already used by a predefined network',
        ),
    );

    it('leaves a predefined coin untouched', async () => {
        await expect(
            registerEvmNetwork({ ...params, symbol: 'tarc', rpcUrls: ['https://x.example'] }),
        ).rejects.toThrow();

        expect(getBackendCoinInfo('tarc').blockchainLink).toEqual({
            type: 'evm-rpc',
            url: ['https://rpc.testnet.arc.network'],
        });
    });
});
