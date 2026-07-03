import type { BankAccount, CryptoId, FiatCurrencyCode, SellFiatTrade } from 'invity-api';

import { configureMockStore, renderHookWithStoreProvider } from '@suite-common/test-utils';
import { type Account, type AccountKey } from '@suite-common/wallet-types';
import { mockWalletAccount } from '@suite-common/wallet-types/mocks';

import { useTradingSellConfirm } from '../useTradingSellConfirm';

jest.mock('@suite/router', () => ({
    ...jest.requireActual('@suite/router'),
    goto: jest.fn((payload: unknown) => ({ type: '@router/goto', payload })),
}));

jest.mock('@suite-common/dependency-injection', () => ({
    ...jest.requireActual('@suite-common/dependency-injection'),
    useServices: () => ({ analytics: { report: jest.fn() } }),
}));

jest.mock('@suite/device', () => ({
    ...jest.requireActual('@suite/device'),
    useDevice: () => ({ device: { connected: true } }),
}));

jest.mock('@suite/intl', () => ({
    ...jest.requireActual('@suite/intl'),
    useTranslation: () => ({ translationString: (id: string) => id }),
}));

jest.mock('src/hooks/wallet/useBitcoinAmountUnit', () => ({
    useBitcoinAmountUnit: () => ({ isBtcSatsAmountUnit: false }),
}));

jest.mock('src/hooks/wallet/trading/form/common/useTradingAssetDecimals', () => ({
    useTradingAssetDecimals: () => ({ getAssetDecimals: () => 8 }),
}));

jest.mock('src/hooks/wallet/trading/useServerEnviroment', () => ({
    useServerEnvironment: jest.fn(),
}));

const mockUseTradingFormAccount = jest.fn();
jest.mock('src/hooks/wallet/trading/form/useTradingFormAccount', () => ({
    useTradingFormAccount: () => mockUseTradingFormAccount(),
}));

jest.mock('@suite-common/message-system', () => ({
    ...jest.requireActual('@suite-common/message-system'),
    selectIsFeatureEnabled: () => true,
}));

jest.mock('@suite/settings', () => ({
    ...jest.requireActual('@suite/settings'),
    selectHasExperimentalFeature: () => () => false,
}));

const mockHandleSellTrade = jest.fn();
jest.mock('src/hooks/wallet/trading/form/common/useTradingSellTradeRequest', () => ({
    useTradingSellTradeRequest: () => ({
        getTradeRequestParams: () =>
            Promise.resolve({
                returnUrl: 'https://return.url',
                processResponseData: jest.fn(),
            }),
        handleSellTrade: mockHandleSellTrade,
    }),
}));

const mockConfirmTradeThunk = jest.fn((args: unknown) =>
    Object.assign(() => Promise.resolve(), { args }),
);
const mockSendTransactionThunk = jest.fn((args: unknown) =>
    Object.assign(() => ({ unwrap: () => Promise.resolve(true) }), { args }),
);

jest.mock('@suite-common/trading', () => {
    const actual = jest.requireActual('@suite-common/trading');

    return {
        ...actual,
        selectTradingIsSlip24Allowed: () => false,
        sellThunks: {
            ...actual.sellThunks,
            confirmTradeThunk: (args: unknown) => mockConfirmTradeThunk(args),
            sendTransactionThunk: (args: unknown) => mockSendTransactionThunk(args),
        },
    };
});

const ACCOUNT = mockWalletAccount({ symbol: 'btc' });
const BITCOIN_CRYPTO_ID = 'bitcoin' as CryptoId;
const EURO_FIAT_CURRENCY = 'EUR' as FiatCurrencyCode;

const SELECTED_QUOTE: SellFiatTrade = {
    fiatStringAmount: '47.12',
    fiatCurrency: EURO_FIAT_CURRENCY,
    cryptoCurrency: BITCOIN_CRYPTO_ID,
    cryptoStringAmount: '0.004',
    quoteId: 'd369ba9e-7370-4a6e-87dc-aefd3851c735',
    exchange: 'cexdirect',
    paymentMethod: 'bankTransfer',
};

const QUOTES_REQUEST = {
    fiatCurrency: EURO_FIAT_CURRENCY,
    cryptoCurrency: BITCOIN_CRYPTO_ID,
    amountInCrypto: true,
};

const BANK_ACCOUNT = { bankAccount: 'iban', holder: 'holder', verified: true } as BankAccount;

type StateOverrides = {
    selectedQuote?: SellFiatTrade;
    quotesRequest?: typeof QUOTES_REQUEST;
    isLoading?: boolean;
    accountKey?: AccountKey;
    accounts?: Account[];
};

const DEFAULTS: Required<StateOverrides> = {
    selectedQuote: SELECTED_QUOTE,
    quotesRequest: QUOTES_REQUEST,
    isLoading: false,
    accountKey: ACCOUNT.key,
    accounts: [ACCOUNT],
};

const buildState = (overrides: StateOverrides = {}) => {
    const { selectedQuote, quotesRequest, isLoading, accountKey, accounts } = {
        ...DEFAULTS,
        ...overrides,
    };

    return {
        wallet: {
            accounts,
            trading: {
                trades: [],
                sell: {
                    selectedQuote,
                    quotesRequest,
                    isLoading,
                    isFromRedirect: false,
                    transactionId: undefined,
                    tradingAccountKey: accountKey,
                    sellInfo: undefined,
                },
                buy: { tradingAccountKey: undefined },
                exchange: { tradingAccountKey: undefined },
            },
        },
    };
};

const renderConfirm = (overrides?: StateOverrides) => {
    const state = buildState(overrides);

    mockUseTradingFormAccount.mockReturnValue({
        tradingAccountKey: state.wallet.trading.sell.tradingAccountKey,
        account: state.wallet.accounts[0],
        cryptoId: BITCOIN_CRYPTO_ID,
    });

    const store = configureMockStore({ preloadedState: state });
    const { result } = renderHookWithStoreProvider(() => useTradingSellConfirm(), { store });

    return { store, result };
};

const gotoActions = (store: ReturnType<typeof renderConfirm>['store']) =>
    store.getActions().filter(action => action.type === '@router/goto');

describe('useTradingSellConfirm', () => {
    beforeEach(() => {
        mockConfirmTradeThunk.mockClear();
        mockSendTransactionThunk.mockClear();
        mockHandleSellTrade.mockClear();
        mockUseTradingFormAccount.mockReset();
    });

    describe('isConfirmDisabled', () => {
        it('is false when quote and account are present and not loading', () => {
            const { result } = renderConfirm();

            expect(result.current.isConfirmDisabled).toBe(false);
        });

        it('is true while loading', () => {
            const { result } = renderConfirm({ isLoading: true });

            expect(result.current.isConfirmDisabled).toBe(true);
        });

        it.each<[string, StateOverrides]>([
            ['the selected quote', { selectedQuote: undefined }],
            ['the active account', { accountKey: undefined, accounts: [] }],
        ])('is true when %s is missing', (_, overrides) => {
            const { result } = renderConfirm(overrides);

            expect(result.current.isConfirmDisabled).toBe(true);
        });
    });

    describe('readiness guard', () => {
        it('does not redirect when the quotes request is present', () => {
            const { store } = renderConfirm();

            expect(gotoActions(store)).toHaveLength(0);
        });

        it('redirects to the sell form when the quotes request is missing', () => {
            const { store } = renderConfirm({ quotesRequest: undefined });

            expect(gotoActions(store)).toEqual([
                { type: '@router/goto', payload: { routeName: 'wallet-trading-sell' } },
            ]);
        });
    });

    describe('confirmTrade', () => {
        it('dispatches confirmTradeThunk with the resolved return url and active account', async () => {
            const { result } = renderConfirm();

            await result.current.confirmTrade(BANK_ACCOUNT);

            expect(mockConfirmTradeThunk).toHaveBeenCalledWith(
                expect.objectContaining({
                    account: ACCOUNT,
                    bankAccount: BANK_ACCOUNT,
                    returnUrl: 'https://return.url',
                }),
            );
        });

        it('does nothing when the account is missing', async () => {
            const { result } = renderConfirm({ accountKey: undefined, accounts: [] });

            await result.current.confirmTrade(BANK_ACCOUNT);

            expect(mockConfirmTradeThunk).not.toHaveBeenCalled();
        });
    });

    describe('addBankAccount', () => {
        it('delegates to handleSellTrade with the selected quote', async () => {
            const { result } = renderConfirm();

            await result.current.addBankAccount();

            expect(mockHandleSellTrade).toHaveBeenCalledWith(SELECTED_QUOTE);
        });
    });

    describe('sendTransaction', () => {
        it('dispatches sendTransactionThunk without form values from the confirm screen', async () => {
            const { result } = renderConfirm();

            await result.current.sendTransaction();

            expect(mockSendTransactionThunk).toHaveBeenCalledTimes(1);
            const [args] = mockSendTransactionThunk.mock.calls[0] as [{ account: Account }];

            expect(args.account).toBe(ACCOUNT);
            expect(args).not.toHaveProperty('formValues');
        });

        it('returns false without dispatching when the account is missing', async () => {
            const { result } = renderConfirm({ accountKey: undefined, accounts: [] });

            const success = await result.current.sendTransaction();

            expect(success).toBe(false);
            expect(mockSendTransactionThunk).not.toHaveBeenCalled();
        });
    });
});
