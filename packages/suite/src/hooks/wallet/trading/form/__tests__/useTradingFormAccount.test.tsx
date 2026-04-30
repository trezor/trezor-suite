import { configureStore } from '@reduxjs/toolkit';
import { renderHook } from '@testing-library/react';
import { type ReactNode } from 'react';
import { Provider } from 'react-redux';

import { type CryptoId } from 'invity-api';

import { type AccountKey } from '@suite-common/wallet-types';

import { useTradingFormAccount } from '../useTradingFormAccount';

// Mock all selector modules that useTradingFormAccount depends on
jest.mock('@suite-common/wallet-core', () => ({
    ...jest.requireActual('@suite-common/wallet-core'),
    selectVisibleDeviceAccounts: jest.fn(),
    selectAccountByKey: jest.fn(),
    useFormDraft: jest.fn().mockReturnValue({
        draft: null,
        saveDraft: jest.fn(),
        removeDraft: jest.fn(),
    }),
}));

jest.mock('@suite-common/token-definitions', () => ({
    ...jest.requireActual('@suite-common/token-definitions'),
    selectTokenDefinitions: jest.fn(),
}));

jest.mock('@suite-common/trading', () => ({
    ...jest.requireActual('@suite-common/trading'),
    selectTradingPrefilledFromAccount: jest.fn(),
    selectTradingAccountKeyByTradeType: jest.fn(),
    tradingBuyActions: {
        setTradingAccountKey: jest.fn().mockReturnValue({ type: 'trading/buy/setAccountKey' }),
    },
    tradingExchangeActions: {
        setTradingAccountKey: jest
            .fn()
            .mockReturnValue({ type: 'trading/exchange/setAccountKey' }),
    },
    tradingSellActions: {
        setTradingAccountKey: jest.fn().mockReturnValue({ type: 'trading/sell/setAccountKey' }),
    },
    tradingActions: {
        setTradingFromPrefilledAccount: jest
            .fn()
            .mockReturnValue({ type: 'trading/setPrefilledFromAccount' }),
    },
}));

const { selectVisibleDeviceAccounts, selectAccountByKey } = jest.requireMock(
    '@suite-common/wallet-core',
);
const { selectTokenDefinitions } = jest.requireMock('@suite-common/token-definitions');
const { selectTradingPrefilledFromAccount, selectTradingAccountKeyByTradeType } =
    jest.requireMock('@suite-common/trading');

const createWrapper = () => {
    const store = configureStore({
        reducer: (state = {}) => state,
    });

    return function Wrapper({ children }: { children: ReactNode }) {
        return <Provider store={store}>{children}</Provider>;
    };
};

const mockAccount = {
    key: 'btc-account-key' as AccountKey,
    symbol: 'btc' as const,
    networkType: 'bitcoin' as const,
    accountType: 'normal' as const,
    index: 0,
    descriptor: 'btc-descriptor',
    deviceState: 'device-state',
    empty: false,
    visible: true,
    balance: '100000000',
    availableBalance: '100000000',
    formattedBalance: '1.0',
    tokens: [],
};

describe('useTradingFormAccount', () => {
    beforeEach(() => {
        selectTokenDefinitions.mockReturnValue({});
        selectTradingPrefilledFromAccount.mockReturnValue({
            key: undefined,
            cryptoId: undefined,
        });
        selectTradingAccountKeyByTradeType.mockReturnValue(undefined);
        selectAccountByKey.mockReturnValue(undefined);
    });

    describe('when no visible device accounts are available', () => {
        beforeEach(() => {
            selectVisibleDeviceAccounts.mockReturnValue([]);
        });

        it('should return undefined account for the buy trade type', () => {
            const { result } = renderHook(() => useTradingFormAccount('buy'), {
                wrapper: createWrapper(),
            });

            expect(result.current.account).toBeUndefined();
        });

        it('should return bitcoin as fallback cryptoId when account is undefined', () => {
            const { result } = renderHook(() => useTradingFormAccount('buy'), {
                wrapper: createWrapper(),
            });

            expect(result.current.cryptoId).toBe<CryptoId>('bitcoin');
        });

        it('should return undefined tradingAccountKey when account is undefined', () => {
            const { result } = renderHook(() => useTradingFormAccount('buy'), {
                wrapper: createWrapper(),
            });

            expect(result.current.tradingAccountKey).toBeUndefined();
        });
    });

    describe('when visible device accounts are available', () => {
        beforeEach(() => {
            selectVisibleDeviceAccounts.mockReturnValue([mockAccount]);
        });

        it('should return the first account as fallback for the buy trade type', () => {
            const { result } = renderHook(() => useTradingFormAccount('buy'), {
                wrapper: createWrapper(),
            });

            expect(result.current.account).toEqual(mockAccount);
        });

        it('should return the account key as tradingAccountKey', () => {
            const { result } = renderHook(() => useTradingFormAccount('buy'), {
                wrapper: createWrapper(),
            });

            expect(result.current.tradingAccountKey).toBe(mockAccount.key);
        });
    });

    describe('when preferred account exists but is no longer eligible', () => {
        const preferredAccount = {
            ...mockAccount,
            key: 'preferred-account-key' as AccountKey,
            symbol: 'eth' as const,
        };

        beforeEach(() => {
            // An empty fallback list but a preferred account key that no longer maps to any account
            selectVisibleDeviceAccounts.mockReturnValue([]);
            selectAccountByKey.mockReturnValue(undefined);
            selectTradingAccountKeyByTradeType.mockReturnValue(preferredAccount.key);
        });

        it('should return undefined account when preferred account is no longer available', () => {
            const { result } = renderHook(() => useTradingFormAccount('buy'), {
                wrapper: createWrapper(),
            });

            expect(result.current.account).toBeUndefined();
        });

        it('should return bitcoin as fallback cryptoId', () => {
            const { result } = renderHook(() => useTradingFormAccount('buy'), {
                wrapper: createWrapper(),
            });

            expect(result.current.cryptoId).toBe<CryptoId>('bitcoin');
        });
    });
});
