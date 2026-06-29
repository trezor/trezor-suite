import { commonQueryKeys, useQuery } from '@suite-common/react-query';
import TrezorConnect from '@trezor/connect';

import { useNftMetadata } from '../useNftMetadata';

jest.mock('@suite-common/react-query', () => ({
    commonQueryKeys: {
        nftMetadata: jest.fn((symbol, contract, tokenId) => [
            'nft-metadata',
            symbol,
            contract,
            tokenId,
        ]),
    },
    useQuery: jest.fn(opts => opts),
}));

jest.mock('@trezor/connect', () => ({
    __esModule: true,
    default: { blockchainEvmRpcCall: jest.fn() },
}));

jest.mock('@suite-common/calldata', () => ({
    encodeTokenUriCall: jest.fn(() => '0xc87b56dd_encoded'),
    encodeErc1155UriCall: jest.fn(() => '0x0e89341c_encoded'),
    decodeUriResult: jest.fn(() => 'https://example.com/metadata/42.json'),
}));

const mockUseQuery = jest.mocked(useQuery);
const mockBlockchainEvmRpcCall = jest.mocked(TrezorConnect.blockchainEvmRpcCall);

const BASE_PARAMS = {
    symbol: 'eth' as const,
    contract: '0xD3D9ddd0CF0A5F0BFB8f7fcEAe075DF687eAEBaB',
    tokenId: '42',
    standard: 'ERC721' as const,
};

describe('useNftMetadata', () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    it('passes correct query key and enabled flag', () => {
        useNftMetadata(BASE_PARAMS);

        expect(commonQueryKeys.nftMetadata).toHaveBeenCalledWith('eth', BASE_PARAMS.contract, '42');
        expect(mockUseQuery).toHaveBeenCalledWith(
            expect.objectContaining({
                enabled: true,
                staleTime: Infinity,
            }),
        );
    });

    it('disables query when contract is empty', () => {
        useNftMetadata({ ...BASE_PARAMS, contract: '' });

        expect(mockUseQuery).toHaveBeenCalledWith(
            expect.objectContaining({ enabled: false }),
        );
    });

    it('disables query when tokenId is empty', () => {
        useNftMetadata({ ...BASE_PARAMS, tokenId: '' });

        expect(mockUseQuery).toHaveBeenCalledWith(
            expect.objectContaining({ enabled: false }),
        );
    });

    it('queryFn fetches metadata via blockchainEvmRpcCall and fetch', async () => {
        const metadata = { name: 'TEST NFT #42', image: 'ipfs://Qm...', attributes: [] };

        mockBlockchainEvmRpcCall.mockResolvedValue({
            success: true,
            payload: { data: '0xabiencoded' },
        } as any);

        global.fetch = jest.fn().mockResolvedValue({
            ok: true,
            json: () => Promise.resolve(metadata),
        } as any);

        useNftMetadata(BASE_PARAMS);

        const opts = mockUseQuery.mock.calls[0]?.[0] as { queryFn: () => Promise<unknown> };
        const result = await opts.queryFn();

        expect(mockBlockchainEvmRpcCall).toHaveBeenCalledWith(
            expect.objectContaining({
                coin: 'eth',
                to: BASE_PARAMS.contract,
            }),
        );
        expect(result).toEqual(metadata);
    });

    it('queryFn throws when blockchainEvmRpcCall fails', async () => {
        mockBlockchainEvmRpcCall.mockResolvedValue({
            success: false,
            error: 'Network error',
        } as any);

        useNftMetadata(BASE_PARAMS);

        const opts = mockUseQuery.mock.calls[0]?.[0] as { queryFn: () => Promise<unknown> };
        await expect(opts.queryFn()).rejects.toThrow('NFT URI fetch failed');
    });
});
