import { asNetworkSymbol } from '@suite-common/wallet-config';
import { type Account, type PrecomposedTransactionFinal } from '@suite-common/wallet-types';
import { mockAccountKey } from '@suite-common/wallet-types/mocks';
import { renderHookWithStoreProvider } from '@suite-native/test-utils-store';

import { useTronFeeBreakdown } from './useTronFeeBreakdown';
import { ETH_ACCOUNT_KEY, getWalletState } from '../../__fixtures__/walletState';

const TRON_ACCOUNT_DESCRIPTOR = 'TRX1234567890abcdefghijklmnopqrstuvwxyz';
const trxSymbol = asNetworkSymbol('trx');
const btcSymbol = asNetworkSymbol('btc');
const TRON_ACCOUNT_KEY = mockAccountKey({
    symbol: trxSymbol,
    descriptor: TRON_ACCOUNT_DESCRIPTOR,
});

const getTronAccount = () =>
    ({
        key: TRON_ACCOUNT_KEY,
        accountLabel: 'Tron #1',
        descriptor: TRON_ACCOUNT_DESCRIPTOR,
        accountType: 'normal',
        symbol: trxSymbol,
        networkType: 'tron',
        balance: '5000000000',
        availableBalance: '5000000000',
        formattedBalance: '5000.000000',
        tokens: [],
        misc: {
            tronResources: {
                availableStakedBandwidth: 0,
                availableFreeBandwidth: 600,
                availableEnergy: 0,
            },
        },
    }) as unknown as Account;

describe('useTronFeeBreakdown', () => {
    const getPreloadedStateWith = (
        extraAccounts: Account[] = [],
        normalFeeOverrides: Partial<PrecomposedTransactionFinal> = {},
    ) => {
        const baseWalletState = getWalletState();

        return {
            wallet: {
                ...baseWalletState,
                accounts: [...baseWalletState.accounts, ...extraAccounts],
                send: {
                    ...baseWalletState.send,
                    feeLevels: {
                        ...baseWalletState.send.feeLevels,
                        normal: {
                            ...baseWalletState.send.feeLevels.normal,
                            ...normalFeeOverrides,
                        },
                    },
                },
            },
        };
    };

    it('should return null for a non-Tron account', async () => {
        const { result } = await renderHookWithStoreProvider(
            () => useTronFeeBreakdown({ accountKey: ETH_ACCOUNT_KEY }),
            { preloadedState: getPreloadedStateWith() },
        );

        expect(result.current).toBeNull();
    });

    it('should return null for a missing account', async () => {
        const { result } = await renderHookWithStoreProvider(
            () =>
                useTronFeeBreakdown({
                    accountKey: mockAccountKey({
                        symbol: btcSymbol,
                        descriptor: 'nonExistent',
                    }),
                }),
            { preloadedState: getPreloadedStateWith() },
        );

        expect(result.current).toBeNull();
    });

    it('should return a breakdown for a Tron account', async () => {
        const { result } = await renderHookWithStoreProvider(
            () => useTronFeeBreakdown({ accountKey: TRON_ACCOUNT_KEY }),
            { preloadedState: getPreloadedStateWith([getTronAccount()]) },
        );

        expect(result.current).toEqual({
            symbol: 'trx',
            networkType: 'tron',
            trxBurned: null,
            areFeesLoading: expect.any(Boolean),
            resourceLabel: expect.any(String),
            isAccountActivation: false,
        });
    });

    it('should expose account activation from the composed Tron fee level', async () => {
        const { result } = await renderHookWithStoreProvider(
            () => useTronFeeBreakdown({ accountKey: TRON_ACCOUNT_KEY }),
            {
                preloadedState: getPreloadedStateWith([getTronAccount()], {
                    fee: '1000000',
                    accountActivationFee: '1000000',
                }),
            },
        );

        expect(result.current?.isAccountActivation).toBe(true);
    });
});
