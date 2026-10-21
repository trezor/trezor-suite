import { getCryptoId } from '@suite-common/trading';
import { asNetworkSymbol, getMainnets, getNetwork } from '@suite-common/wallet-config';
import { mockAccountToken, mockWalletAccount } from '@suite-common/wallet-types/mocks';

import { getGlobalReceiveAssetIdsWithHistory } from './getGlobalReceiveAssetIdsWithHistory';

const networks = getMainnets();
const USDC_CONTRACT = '0xa0b86991c6218b36c1d19d4a2e9eb0ce3606eb48';

describe('getGlobalReceiveAssetIdsWithHistory', () => {
    it('includes used native assets but not newly created or unfunded unknown-history accounts', () => {
        const assetIds = getGlobalReceiveAssetIdsWithHistory({
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

        expect(assetIds).toEqual(
            new Set([getCryptoId(asNetworkSymbol('btc')), getCryptoId(asNetworkSymbol('xrp'))]),
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
        const assetIds = getGlobalReceiveAssetIdsWithHistory({
            networks,
            accounts: [account],
            transactions: {},
        });

        expect(assetIds).toEqual(
            new Set([getCryptoId(account.symbol), getCryptoId(account.symbol, USDC_CONTRACT)]),
        );
    });

    it('uses cached transfers even when a spent token is no longer in account metadata', () => {
        const account = mockWalletAccount({
            symbol: asNetworkSymbol('eth'),
            empty: true,
            history: { total: 0, unconfirmed: 0 },
            tokens: [],
        });
        const assetIds = getGlobalReceiveAssetIdsWithHistory({
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

        expect(assetIds).toEqual(
            new Set([getCryptoId(account.symbol), getCryptoId(account.symbol, USDC_CONTRACT)]),
        );
    });

    it('excludes unsupported networks and testnets before creating asset IDs', () => {
        const bitcoin = mockWalletAccount({ symbol: asNetworkSymbol('btc') });
        const assetIds = getGlobalReceiveAssetIdsWithHistory({
            networks: [getNetwork('btc')],
            accounts: [
                bitcoin,
                mockWalletAccount({ symbol: asNetworkSymbol('eth') }),
                mockWalletAccount({ symbol: asNetworkSymbol('regtest') }),
            ],
            transactions: {},
        });

        expect(assetIds).toEqual(new Set([getCryptoId(bitcoin.symbol)]));
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
        const assetIds = getGlobalReceiveAssetIdsWithHistory({
            networks,
            accounts: [account],
            transactions: {},
        });

        expect(assetIds.has(getCryptoId(account.symbol))).toBe(true);
    });
});
