import type { BuyTrade, CryptoId, FiatCurrencyCode } from 'invity-api';

import { configureMockStore, renderHookWithStoreProvider } from '@suite-common/test-utils';
import { type Account, type AccountKey } from '@suite-common/wallet-types';
import { mockWalletAccount } from '@suite-common/wallet-types/mocks';

import { useTradingBuyConfirm } from './useTradingBuyConfirm';

jest.mock('@suite/router', () => ({
    ...jest.requireActual('@suite/router'),
    goto: jest.fn((payload: unknown) => ({ type: '@router/goto', payload })),
}));

jest.mock('@suite-common/dependency-injection', () => ({
    ...jest.requireActual('@suite-common/dependency-injection'),
    useServices: () => ({ analytics: { report: jest.fn() } }),
}));

const mockConfirmTradeThunk = jest.fn((args: unknown) => {
    const thunk = () => ({ unwrap: () => Promise.resolve({ paymentId: 'payment-1' }) });

    return Object.assign(thunk, { args });
});

jest.mock('@suite-common/trading', () => {
    const actual = jest.requireActual('@suite-common/trading');

    return {
        ...actual,
        buyThunks: {
            ...actual.buyThunks,
            confirmTradeThunk: (args: unknown) => mockConfirmTradeThunk(args),
        },
    };
});

const ACCOUNT = mockWalletAccount({ symbol: 'btc' });
const BITCOIN_CRYPTO_ID = 'bitcoin' as CryptoId;
const EURO_FIAT_CURRENCY = 'EUR' as FiatCurrencyCode;

const SELECTED_QUOTE: BuyTrade = {
    fiatStringAmount: '47.12',
    fiatCurrency: EURO_FIAT_CURRENCY,
    receiveCurrency: BITCOIN_CRYPTO_ID,
    receiveStringAmount: '0.004705020432603938',
    rate: 10014.834297738,
    quoteId: 'd369ba9e-7370-4a6e-87dc-aefd3851c735',
    exchange: 'paybis',
    minFiat: 20.03,
    maxFiat: 2000.05,
    minCrypto: 0.002,
    maxCrypto: 0.19952,
    paymentMethod: 'creditCard',
    paymentId: 'payment-1',
};

type StateOverrides = {
    selectedQuote?: BuyTrade;
    receiveAddress?: string;
    isLoading?: boolean;
    accountKey?: AccountKey;
    accounts?: Account[];
};

const DEFAULTS: Required<StateOverrides> = {
    selectedQuote: SELECTED_QUOTE,
    receiveAddress: 'bc1qreceive',
    isLoading: false,
    accountKey: ACCOUNT.key,
    accounts: [ACCOUNT],
};

const buildState = (overrides: StateOverrides = {}) => {
    const { selectedQuote, receiveAddress, isLoading, accountKey, accounts } = {
        ...DEFAULTS,
        ...overrides,
    };

    return {
        wallet: {
            accounts,
            trading: {
                buy: {
                    selectedQuote,
                    receiveAddress,
                    isLoading,
                    tradingAccountKey: accountKey,
                    receiveAccountKey: undefined,
                    buyInfo: undefined,
                },
                sell: {
                    tradingAccountKey: undefined,
                },
                exchange: {
                    tradingAccountKey: undefined,
                },
            },
        },
    };
};

const renderConfirm = (overrides?: StateOverrides) => {
    const store = configureMockStore({ preloadedState: buildState(overrides) });
    const { result } = renderHookWithStoreProvider(() => useTradingBuyConfirm(), { store });

    return { store, result };
};

const gotoActions = (store: ReturnType<typeof renderConfirm>['store']) =>
    store.getActions().filter(action => action.type === '@router/goto');

describe('useTradingBuyConfirm', () => {
    beforeEach(() => {
        mockConfirmTradeThunk.mockClear();
    });

    describe('isConfirmDisabled', () => {
        it('is false when quote, receive address and account are all present', () => {
            const { result } = renderConfirm();

            expect(result.current.isConfirmDisabled).toBe(false);
        });

        it('is true while loading', () => {
            const { result } = renderConfirm({ isLoading: true });

            expect(result.current.isConfirmDisabled).toBe(true);
        });

        it.each<[string, StateOverrides]>([
            ['the selected quote', { selectedQuote: undefined }],
            ['the receive address', { receiveAddress: undefined }],
            ['the active account', { accountKey: undefined, accounts: [] }],
        ])('is true when %s is missing', (_, overrides) => {
            const { result } = renderConfirm(overrides);

            expect(result.current.isConfirmDisabled).toBe(true);
        });
    });

    describe('readiness guard', () => {
        it('does not redirect when every requirement is satisfied', () => {
            const { store } = renderConfirm();

            expect(gotoActions(store)).toHaveLength(0);
        });

        it('redirects to the buy form when a requirement is missing', () => {
            const { store } = renderConfirm({ selectedQuote: undefined });

            expect(gotoActions(store)).toEqual([
                { type: '@router/goto', payload: { routeName: 'wallet-trading-buy' } },
            ]);
        });
    });

    describe('confirmTrade', () => {
        it('dispatches confirmTradeThunk with the persisted address and active account', async () => {
            const { result } = renderConfirm();

            await result.current.confirmTrade();

            expect(mockConfirmTradeThunk).toHaveBeenCalledWith(
                expect.objectContaining({
                    quote: SELECTED_QUOTE,
                    address: 'bc1qreceive',
                    account: ACCOUNT,
                    returnUrl: expect.any(String),
                }),
            );
        });

        it('does nothing when the receive address is missing', async () => {
            const { result } = renderConfirm({ receiveAddress: undefined });

            await result.current.confirmTrade();

            expect(mockConfirmTradeThunk).not.toHaveBeenCalled();
        });
    });
});
