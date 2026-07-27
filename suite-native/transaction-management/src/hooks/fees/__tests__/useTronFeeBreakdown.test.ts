import { type Account } from '@suite-common/wallet-types';
import { mockAccountKey } from '@suite-common/wallet-types/mocks';
import { renderHookWithStoreProvider } from '@suite-native/test-utils-store';

import { ETH_ACCOUNT_KEY, getWalletState } from '../../../__fixtures__/walletState';
import { useTronFeeBreakdown } from '../useTronFeeBreakdown';

const TRON_ACCOUNT_DESCRIPTOR = 'TRX1234567890abcdefghijklmnopqrstuvwxyz';
const TRON_ACCOUNT_KEY = mockAccountKey({
    symbol: 'trx',
    descriptor: TRON_ACCOUNT_DESCRIPTOR,
});

const getTronAccount = () =>
    ({
        key: TRON_ACCOUNT_KEY,
        accountLabel: 'Tron #1',
        descriptor: TRON_ACCOUNT_DESCRIPTOR,
        accountType: 'normal',
        symbol: 'trx',
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
    const getPreloadedStateWith = (extraAccounts: Account[] = []) => {
        const baseWalletState = getWalletState();

        return {
            wallet: {
                ...baseWalletState,
                accounts: [...baseWalletState.accounts, ...extraAccounts],
            },
        };
    };

    it('should return null for a non-Tron account', () => {
        const { result } = renderHookWithStoreProvider(
            () => useTronFeeBreakdown({ accountKey: ETH_ACCOUNT_KEY }),
            { preloadedState: getPreloadedStateWith() },
        );

        expect(result.current).toBeNull();
    });

    it('should return null for a missing account', () => {
        const { result } = renderHookWithStoreProvider(
            () =>
                useTronFeeBreakdown({
                    accountKey: mockAccountKey({ symbol: 'btc', descriptor: 'nonExistent' }),
                }),
            { preloadedState: getPreloadedStateWith() },
        );

        expect(result.current).toBeNull();
    });

    it('should return a breakdown for a Tron account', () => {
        const { result } = renderHookWithStoreProvider(
            () => useTronFeeBreakdown({ accountKey: TRON_ACCOUNT_KEY }),
            { preloadedState: getPreloadedStateWith([getTronAccount()]) },
        );

        expect(result.current).toEqual({
            symbol: 'trx',
            networkType: 'tron',
            trxBurned: null,
            areFeesLoading: expect.any(Boolean),
            resourceLabel: expect.any(String),
        });
    });
});
