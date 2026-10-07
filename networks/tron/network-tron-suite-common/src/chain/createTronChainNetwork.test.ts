import { asNetworkSymbol } from '@trezor/network-module-types';

import { type TronChainNetworkDeps, createTronChainNetwork } from './createTronChainNetwork';

const { signal } = new AbortController();

const getAccountInfo = jest.fn();
const blockchainGetCurrentFiatRates = jest.fn();
const fetchCoinGeckoCurrentRate = jest.fn();

const deps: TronChainNetworkDeps = {
    getTrezorConnect: () => ({ getAccountInfo, blockchainGetCurrentFiatRates }),
    fetchCoinGeckoCurrentRate,
};

const trx = asNetworkSymbol('trx');
const network = createTronChainNetwork(deps)({
    symbol: trx,
    backend: { type: 'blockbook', urls: [] },
});
const ref = {
    symbol: trx,
    descriptor: 'TAddress',
    accountType: 'normal',
    watchedTokens: ['TCustom'],
} as const;

describe('createTronChainNetwork', () => {
    beforeEach(() => {
        jest.resetAllMocks();
    });

    it('reads sun and shows the available balance', async () => {
        getAccountInfo.mockResolvedValue({
            success: true,
            payload: { balance: '5000000', availableBalance: '4000000', empty: false },
        });

        await expect(network.getAccountBalance({ ref, signal })).resolves.toMatchObject({
            balance: '5',
            displayBalance: '4',
        });
    });

    it('reads TRC10 and TRC20 tokens, leaves NFTs out and asks for watched ones', async () => {
        getAccountInfo
            .mockResolvedValueOnce({
                success: true,
                payload: {
                    tokens: [
                        { standard: 'TRC20', contract: 'TUsdt', decimals: 6, balance: '1000000' },
                        { standard: 'TRC721', contract: 'TNft', decimals: 0, balance: '1' },
                    ],
                },
            })
            .mockResolvedValueOnce({
                success: true,
                payload: {
                    tokens: [{ standard: 'TRC10', contract: 'TCustom', decimals: 0, balance: '7' }],
                },
            });

        const tokens = await network.getTokens?.({ ref, signal });

        expect(tokens?.map(({ contract, balance }) => [contract, balance])).toEqual([
            ['TUsdt', '1'],
            ['TCustom', '7'],
        ]);
        expect(getAccountInfo).toHaveBeenLastCalledWith(
            expect.objectContaining({ coin: 'trx', contractFilter: 'TCustom' }),
        );
    });

    it('takes coin and token rates from Blockbook', async () => {
        blockchainGetCurrentFiatRates.mockResolvedValue({
            success: true,
            payload: { ts: 1, rates: { usd: 0.3 } },
        });

        await network.getNativeFiatRate({ currency: 'usd', signal });
        await network.getTokenFiatRate?.({ contract: 'TUsdt', currency: 'usd', signal });

        expect(blockchainGetCurrentFiatRates.mock.calls.map(([params]) => params.token)).toEqual([
            undefined,
            'TUsdt',
        ]);
        expect(fetchCoinGeckoCurrentRate).not.toHaveBeenCalled();
    });
});
