/**
 * @jest-environment jsdom
 */
import { newTestQueryClient, renderHookWithQueryClient, waitFor } from '@suite-common/test-utils';
import { getTokenMetadata } from '@trezor/blockchain-link-utils/src/stellar';

import { useStellarTokenInfo, useStellarTokenInfos } from './useStellarTokenInfo';

jest.mock('@trezor/blockchain-link-utils/src/stellar', () => ({
    ...jest.requireActual('@trezor/blockchain-link-utils/src/stellar'),
    getTokenMetadata: jest.fn(),
}));

const mockedGetTokenMetadata = jest.mocked(getTokenMetadata);

const USDC = 'USDC-GA123';
const AQUA = 'AQUA-GB456';

mockedGetTokenMetadata.mockResolvedValue({
    [USDC]: { name: 'USD Coin', symbol: 'USDC', home_domain: 'centre.io', rating: 5 },
    [AQUA]: { name: 'Aqua', symbol: 'AQUA', home_domain: 'aqua.network', rating: 2 },
});

describe(useStellarTokenInfo.name, () => {
    it('describes the token once the definitions are in', async () => {
        const { result } = renderHookWithQueryClient(() => useStellarTokenInfo(USDC));

        await waitFor(() => expect(result.current.isSuccess).toBe(true));

        expect(result.current.data).toEqual(
            expect.objectContaining({
                contract: USDC,
                name: 'USD Coin',
                symbol: 'USDC',
                homeDomain: 'centre.io',
            }),
        );
    });

    it('still names a token the definitions say nothing about', async () => {
        const { result } = renderHookWithQueryClient(() => useStellarTokenInfo('YBX-GC789'));

        await waitFor(() => expect(result.current.isSuccess).toBe(true));

        expect(result.current.data).toEqual(
            expect.objectContaining({ contract: 'YBX-GC789', symbol: 'YBX', name: undefined }),
        );
    });
});

describe(useStellarTokenInfos.name, () => {
    it('answers for every token it is asked about', async () => {
        const { result } = renderHookWithQueryClient(() => useStellarTokenInfos([USDC, AQUA]));

        await waitFor(() => expect(result.current.every(token => token.isSuccess)).toBe(true));

        expect(result.current.map(token => token.data?.name)).toEqual(['USD Coin', 'Aqua']);
    });

    it('serves a token already asked about on its own from the same cache entry', async () => {
        const queryClient = newTestQueryClient();
        const single = renderHookWithQueryClient(() => useStellarTokenInfo(USDC), { queryClient });

        await waitFor(() => expect(single.result.current.isSuccess).toBe(true));

        const many = renderHookWithQueryClient(() => useStellarTokenInfos([USDC]), { queryClient });

        expect(many.result.current[0]?.data).toEqual(single.result.current.data);
    });
});
