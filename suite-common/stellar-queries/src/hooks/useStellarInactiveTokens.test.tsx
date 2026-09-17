/**
 * @jest-environment jsdom
 */
import { commonQueryKeys } from '@suite-common/react-query';
import { newTestQueryClient, renderHookWithQueryClient } from '@suite-common/test-utils';
import { type Account } from '@suite-common/wallet-types';
import { getTokenMetadata } from '@trezor/blockchain-link-utils/src/stellar';

import { useStellarInactiveTokens } from './useStellarInactiveTokens';

jest.mock('@trezor/blockchain-link-utils/src/stellar', () => ({
    ...jest.requireActual('@trezor/blockchain-link-utils/src/stellar'),
    // The definitions are seeded into the cache instead; a test that wants them pending says so.
    getTokenMetadata: jest.fn(() => new Promise(() => {})),
}));

const USDC = 'USDC-GA123';
const AQUA = 'AQUA-GB456';
const YBX = 'YBX-GC789';

const TOKEN_METADATA = {
    [USDC]: { name: 'USD Coin', symbol: 'USDC', home_domain: 'centre.io', rating: 5 },
    [AQUA]: { name: 'Aqua', symbol: 'AQUA', home_domain: 'aqua.network', rating: 2 },
    [YBX]: { name: 'YBX', symbol: 'YBX', home_domain: 'ultra.io', rating: 9 },
};

const stellarAccount = (contracts: string[] = []) =>
    ({ symbol: 'xlm', tokens: contracts.map(contract => ({ contract })) }) as Account;

const renderWithDefinitions = (params: Parameters<typeof useStellarInactiveTokens>[0]) => {
    const queryClient = newTestQueryClient();
    queryClient.setQueryData(commonQueryKeys.stellarTokenMetadata(), TOKEN_METADATA);

    return renderHookWithQueryClient(() => useStellarInactiveTokens(params), { queryClient });
};

describe(useStellarInactiveTokens.name, () => {
    it('offers every known token, best-rated first', () => {
        const { result } = renderWithDefinitions({ account: stellarAccount() });

        expect(result.current.inactiveTokens.map(token => token.contract)).toEqual([
            YBX,
            USDC,
            AQUA,
        ]);
        expect(result.current.isLoading).toBe(false);
    });

    it('leaves out a token the account already holds', () => {
        const { result } = renderWithDefinitions({ account: stellarAccount([YBX]) });

        expect(result.current.inactiveTokens.map(token => token.contract)).toEqual([USDC, AQUA]);
    });

    it('describes only the tokens the caller asks about', () => {
        const { result } = renderWithDefinitions({
            account: stellarAccount(),
            contracts: [AQUA],
        });

        expect(result.current.inactiveTokens).toEqual([
            expect.objectContaining({ contract: AQUA, name: 'Aqua', homeDomain: 'aqua.network' }),
        ]);
    });

    it('offers nothing for an account of another network, and does not fetch for it', () => {
        const { result } = renderWithDefinitions({ account: { symbol: 'btc' } as Account });

        expect(result.current.inactiveTokens).toEqual([]);
        expect(result.current.isLoading).toBe(false);
        expect(getTokenMetadata).not.toHaveBeenCalled();
    });

    it('reports loading while the definitions are still on their way', () => {
        const { result } = renderHookWithQueryClient(() =>
            useStellarInactiveTokens({ account: stellarAccount() }),
        );

        expect(result.current.isLoading).toBe(true);
        expect(result.current.inactiveTokens).toEqual([]);
    });
});
