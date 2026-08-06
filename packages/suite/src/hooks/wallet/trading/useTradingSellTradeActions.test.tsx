import type { BankAccount, CryptoId, FiatCurrencyCode, SellFiatTrade } from 'invity-api';

import { configureMockStore, renderHookWithStoreProvider } from '@suite-common/test-utils';
import { asNetworkSymbol } from '@suite-common/wallet-config';
import { type Account, type AccountKey } from '@suite-common/wallet-types';
import { mockWalletAccount } from '@suite-common/wallet-types/mocks';

import { useTradingSellTradeActions } from './useTradingSellTradeActions';

jest.mock('@suite/router', () => ({
    ...jest.requireActual('@suite/router'),
    goto: jest.fn((payload: unknown) => ({ type: '@router/goto', payload })),
}));

const mockLoadInitialDataThunk = jest.fn((args: unknown) =>
    Object.assign(() => Promise.resolve(), { type: '@trading/loadInitialData', args }),
);

jest.mock('@suite-common/dependency-injection', () => ({
    ...jest.requireActual('@suite-common/dependency-injection'),
    useServices: () => ({ analytics: { report: jest.fn() } }),
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

const mockBuildSellReturnUrl = jest.fn((..._args: unknown[]) =>
    Promise.resolve('https://return.url'),
);
jest.mock('src/utils/wallet/trading/buildSellReturnUrl', () => ({
    buildSellReturnUrl: (...args: unknown[]) => mockBuildSellReturnUrl(...args),
}));

const mockRequestSellTradeThunk = jest.fn((args: unknown) =>
    Object.assign(() => ({ unwrap: () => Promise.resolve({ isRedirecting: false }) }), { args }),
);
jest.mock('src/actions/wallet/trading/sell/requestSellTradeThunk', () => ({
    requestSellTradeThunk: (args: unknown) => mockRequestSellTradeThunk(args),
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
        tradingThunks: {
            ...actual.tradingThunks,
            loadInitialDataThunk: (args: unknown) => mockLoadInitialDataThunk(args),
        },
        sellThunks: {
            ...actual.sellThunks,
            confirmTradeThunk: (args: unknown) => mockConfirmTradeThunk(args),
            sendTransactionThunk: (args: unknown) => mockSendTransactionThunk(args),
        },
    };
});

const ACCOUNT = mockWalletAccount({ symbol: asNetworkSymbol('btc') });
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
    accountKey?: AccountKey;
    accounts?: Account[];
};

const DEFAULTS: Required<StateOverrides> = {
    selectedQuote: SELECTED_QUOTE,
    quotesRequest: QUOTES_REQUEST,
    accountKey: ACCOUNT.key,
    accounts: [ACCOUNT],
};

const buildState = (overrides: StateOverrides = {}) => {
    const { selectedQuote, quotesRequest, accountKey, accounts } = {
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
                    isLoading: false,
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

const renderActions = (overrides?: StateOverrides) => {
    const state = buildState(overrides);

    mockUseTradingFormAccount.mockReturnValue({
        tradingAccountKey: state.wallet.trading.sell.tradingAccountKey,
        account: state.wallet.accounts[0],
        cryptoId: BITCOIN_CRYPTO_ID,
    });

    const store = configureMockStore({ preloadedState: state });
    const { result } = renderHookWithStoreProvider(() => useTradingSellTradeActions(), { store });

    return { store, result };
};

describe('useTradingSellTradeActions', () => {
    beforeEach(() => {
        mockConfirmTradeThunk.mockClear();
        mockSendTransactionThunk.mockClear();
        mockBuildSellReturnUrl.mockClear();
        mockRequestSellTradeThunk.mockClear();
        mockUseTradingFormAccount.mockReset();
    });

    describe('mount is side-effect free', () => {
        it('does not dispatch anything on mount', () => {
            const { store } = renderActions();

            expect(store.getActions()).toHaveLength(0);
        });

        it('does not redirect nor initialize even when the quotes request is missing', () => {
            const { store } = renderActions({ quotesRequest: undefined });

            expect(store.getActions()).toHaveLength(0);
        });
    });

    describe('confirmTrade', () => {
        it('dispatches confirmTradeThunk with the resolved return url and active account', async () => {
            const { result } = renderActions();

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
            const { result } = renderActions({ accountKey: undefined, accounts: [] });

            await result.current.confirmTrade(BANK_ACCOUNT);

            expect(mockConfirmTradeThunk).not.toHaveBeenCalled();
        });
    });

    describe('addBankAccount', () => {
        it('delegates to requestSellTradeThunk with the selected quote', async () => {
            const { result } = renderActions();

            await result.current.addBankAccount();

            expect(mockRequestSellTradeThunk).toHaveBeenCalledWith({ quote: SELECTED_QUOTE });
        });
    });

    describe('sendTransaction', () => {
        it('dispatches sendTransactionThunk without form values from the confirm screen', async () => {
            const { result } = renderActions();

            await result.current.sendTransaction();

            expect(mockSendTransactionThunk).toHaveBeenCalledTimes(1);
            const [args] = mockSendTransactionThunk.mock.calls[0] as [{ account: Account }];

            expect(args.account).toBe(ACCOUNT);
            expect(args).not.toHaveProperty('formValues');
        });

        it('returns false without dispatching when the account is missing', async () => {
            const { result } = renderActions({ accountKey: undefined, accounts: [] });

            const success = await result.current.sendTransaction();

            expect(success).toBe(false);
            expect(mockSendTransactionThunk).not.toHaveBeenCalled();
        });
    });
});
