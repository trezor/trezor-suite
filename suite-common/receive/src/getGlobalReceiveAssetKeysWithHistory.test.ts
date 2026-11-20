import { getAssetKey, toTokenAddress } from '@suite-common/tokens';
import { asNetworkSymbol, getMainnets, getNetwork } from '@suite-common/wallet-config';
import { mockAccountToken, mockWalletAccount } from '@suite-common/wallet-types/mocks';

import { getGlobalReceiveAssetKeysWithHistory } from './getGlobalReceiveAssetKeysWithHistory';

const networks = getMainnets();
const USDC_CONTRACT = '0xa0b86991c6218b36c1d19d4a2e9eb0ce3606eb48';

describe('getGlobalReceiveAssetKeysWithHistory', () => {
    it('includes used native assets but not newly created or unfunded unknown-history accounts', () => {
        const assetKeys = getGlobalReceiveAssetKeysWithHistory({
            networks,
            accounts: [
                mockWalletAccount({
                    symbol: asNetworkSymbol('btc'),
                    formattedBalance: '0',
                    history: { total: 3, unconfirmed: 0 },
                }),
                mockWalletAccount({
                    symbol: asNetworkSymbol('eth'),
                    empty: true,
                    history: { total: 0, unconfirmed: 0 },
                }),
                mockWalletAccount({
                    symbol: asNetworkSymbol('xrp'),
                    empty: false,
                    history: { total: -1, unconfirmed: 0 },
                }),
                mockWalletAccount({
                    symbol: asNetworkSymbol('xlm'),
                    empty: true,
                    history: { total: -1, unconfirmed: 0 },
                }),
            ],
            transactions: {},
        });

        expect(assetKeys).toEqual(
            new Set([
                getAssetKey({ networkSymbol: asNetworkSymbol('btc') }),
                getAssetKey({ networkSymbol: asNetworkSymbol('xrp') }),
            ]),
        );
    });

    it('includes a spent token with recorded sent or received amounts, not all tokens on its network', () => {
        const account = mockWalletAccount({
            symbol: asNetworkSymbol('eth'),
            formattedBalance: '0',
            tokens: [
                mockAccountToken({
                    contract: USDC_CONTRACT.toUpperCase(),
                    balance: '0',
                    totalSent: '1',
                }),
                mockAccountToken({
                    contract: '0x-unused',
                    balance: '0',
                    totalSent: '0',
                    totalReceived: '0',
                }),
            ],
        });
        const assetKeys = getGlobalReceiveAssetKeysWithHistory({
            networks,
            accounts: [account],
            transactions: {},
        });

        expect(assetKeys).toEqual(
            new Set([
                getAssetKey({ networkSymbol: account.symbol }),
                getAssetKey({
                    networkSymbol: account.symbol,
                    contractAddress: toTokenAddress(USDC_CONTRACT),
                }),
            ]),
        );
    });

    it('uses cached transfers even when a spent token is no longer in account metadata', () => {
        const account = mockWalletAccount({
            symbol: asNetworkSymbol('eth'),
            empty: true,
            history: { total: 0, unconfirmed: 0 },
            tokens: [],
        });
        const assetKeys = getGlobalReceiveAssetKeysWithHistory({
            networks,
            accounts: [account],
            transactions: {
                [account.key]: [
                    null,
                    {
                        tokens: [
                            {
                                type: 'sent',
                                amount: '1',
                                contract: USDC_CONTRACT,
                                from: 'sender',
                                to: 'recipient',
                                decimals: 6,
                            },
                        ],
                    },
                ],
            },
        });

        expect(assetKeys).toEqual(
            new Set([
                getAssetKey({ networkSymbol: account.symbol }),
                getAssetKey({
                    networkSymbol: account.symbol,
                    contractAddress: toTokenAddress(USDC_CONTRACT),
                }),
            ]),
        );
    });

    it('excludes unsupported networks and testnets before creating asset IDs', () => {
        const bitcoin = mockWalletAccount({ symbol: asNetworkSymbol('btc') });
        const assetKeys = getGlobalReceiveAssetKeysWithHistory({
            networks: [getNetwork('btc')],
            accounts: [
                bitcoin,
                mockWalletAccount({ symbol: asNetworkSymbol('eth') }),
                mockWalletAccount({ symbol: asNetworkSymbol('regtest') }),
            ],
            transactions: {},
        });

        expect(assetKeys).toEqual(new Set([getAssetKey({ networkSymbol: bitcoin.symbol })]));
    });

    it.each([
        { total: 0, unconfirmed: 1 },
        { total: 0, unconfirmed: 0, tokens: 1 },
    ])('recognizes pending or token-only account history: %o', history => {
        const account = mockWalletAccount({
            symbol: asNetworkSymbol('eth'),
            empty: true,
            history,
        });
        const assetKeys = getGlobalReceiveAssetKeysWithHistory({
            networks,
            accounts: [account],
            transactions: {},
        });

        expect(assetKeys.has(getAssetKey({ networkSymbol: account.symbol }))).toBe(true);
    });
});
