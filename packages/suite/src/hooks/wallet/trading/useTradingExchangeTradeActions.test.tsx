import type { CryptoId, ExchangeTrade } from 'invity-api';

import { configureMockStore, renderHookWithStoreProvider } from '@suite-common/test-utils';
import { notificationsActions } from '@suite-common/toast-notifications';
import { exchangeInitialState, initialState as tradingInitialState } from '@suite-common/trading';
import { asNetworkSymbol } from '@suite-common/wallet-config';
import { type Account } from '@suite-common/wallet-types';
import { mockWalletAccount } from '@suite-common/wallet-types/mocks';

import { useTradingExchangeTradeActions } from './useTradingExchangeTradeActions';

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

jest.mock('src/hooks/wallet/trading/form/common/useTradingExchangeTradeRequest', () => ({
    useTradingExchangeTradeRequest: () => ({
        getTradeRequestParams: () =>
            Promise.resolve({
                returnUrl: 'https://return.url',
                triggerAnalyticsTradeConfirmation: jest.fn(),
                processResponseData: jest.fn(),
                nextStep: jest.fn(),
            }),
    }),
}));

const CONFIRMED_TRADE = { quoteId: 'confirmed-quote' } as ExchangeTrade;

const mockConfirmTradeThunk = jest.fn((args: unknown) =>
    Object.assign(() => ({ unwrap: () => Promise.resolve(CONFIRMED_TRADE) }), { args }),
);
const mockSendTransactionThunk = jest.fn((args: unknown) =>
    Object.assign(() => ({ unwrap: () => Promise.resolve(true) }), { args }),
);
const mockSignDataAndConfirmThunk = jest.fn((args: unknown) =>
    Object.assign(() => Promise.resolve(), { args }),
);

jest.mock('@suite-common/trading', () => {
    const actual = jest.requireActual('@suite-common/trading');

    return {
        ...actual,
        selectTradingIsSlip24Allowed: () => false,
        exchangeThunks: {
            ...actual.exchangeThunks,
            confirmTradeThunk: (args: unknown) => mockConfirmTradeThunk(args),
            sendTransactionThunk: (args: unknown) => mockSendTransactionThunk(args),
            signDataAndConfirmThunk: (args: unknown) => mockSignDataAndConfirmThunk(args),
        },
    };
});

const ACCOUNT = mockWalletAccount({ symbol: asNetworkSymbol('eth') });
const ETHEREUM_CRYPTO_ID = 'ethereum' as CryptoId;
const BITCOIN_CRYPTO_ID = 'bitcoin' as CryptoId;

const SELECTED_QUOTE: ExchangeTrade = {
    quoteId: 'd369ba9e-7370-4a6e-87dc-aefd3851c735',
    exchange: 'changelly',
    send: ETHEREUM_CRYPTO_ID,
    receive: BITCOIN_CRYPTO_ID,
    sendStringAmount: '1',
    receiveStringAmount: '0.05',
};

type StateOverrides = {
    selectedQuote?: ExchangeTrade | undefined;
    accountKey?: Account['key'] | undefined;
    accounts?: Account[];
    extraField?: string | undefined;
};

const buildState = (overrides: StateOverrides = {}) => {
    const selectedQuote = 'selectedQuote' in overrides ? overrides.selectedQuote : SELECTED_QUOTE;
    const accountKey = 'accountKey' in overrides ? overrides.accountKey : ACCOUNT.key;
    const accounts = 'accounts' in overrides ? overrides.accounts : [ACCOUNT];
    const extraField = 'extraField' in overrides ? overrides.extraField : undefined;

    const overridesForExchange = {
        selectedQuote,
        tradingAccountKey: accountKey,
        extraField,
    };

    return {
        wallet: {
            accounts,
            trading: {
                ...tradingInitialState,
                exchange: { ...exchangeInitialState, ...overridesForExchange },
            },
        },
    };
};

const renderActions = (overrides?: StateOverrides) => {
    const state = buildState(overrides);
    const tradingState = state.wallet?.trading;
    const account = state.wallet?.accounts?.[0];

    mockUseTradingFormAccount.mockReturnValue({
        tradingAccountKey: tradingState?.exchange.tradingAccountKey,
        account,
        cryptoId: ETHEREUM_CRYPTO_ID,
    });

    const store = configureMockStore({ preloadedState: state });
    const { result } = renderHookWithStoreProvider(() => useTradingExchangeTradeActions(), {
        store,
    });

    return { store, result };
};

describe('useTradingExchangeTradeActions', () => {
    beforeEach(() => {
        mockConfirmTradeThunk.mockClear();
        mockSendTransactionThunk.mockClear();
        mockSignDataAndConfirmThunk.mockClear();
        mockUseTradingFormAccount.mockReset();
    });

    describe('mount is side-effect free', () => {
        it('does not dispatch anything on mount', () => {
            const { store } = renderActions();

            expect(store.getActions()).toHaveLength(0);
        });
    });

    describe('sendTransaction', () => {
        it('dispatches sendTransactionThunk with setMaxOutputId undefined from the confirm screen', async () => {
            const { result } = renderActions();

            await result.current.sendTransaction();

            expect(mockSendTransactionThunk).toHaveBeenCalledTimes(1);
            const [args] = mockSendTransactionThunk.mock.calls[0] as [
                { account: Account; setMaxOutputId: unknown },
            ];

            expect(args.account).toBe(ACCOUNT);
            expect(args.setMaxOutputId).toBeUndefined();
        });

        const rejectSendWith = (rejection: unknown) => {
            mockSendTransactionThunk.mockImplementationOnce((args: unknown) =>
                Object.assign(() => ({ unwrap: () => Promise.reject(rejection) }), { args }),
            );
        };

        const toastsOf = (actions: { type: string }[]) =>
            actions.filter(action => action.type === notificationsActions.addToast.type);

        it('adds no toast of its own when the signing was cancelled', async () => {
            rejectSendWith({
                type: 'sign-cancelled',
                error: { id: 'TR_TRADING_CANNOT_SEND_TRANSACTION' },
            });
            const { store, result } = renderActions();

            const success = await result.current.sendTransaction();

            expect(success).toBe(false);
            expect(toastsOf(store.getActions())).toHaveLength(0);
        });

        it('reports an error nothing else has reported', async () => {
            rejectSendWith({
                type: 'sign-tx-error',
                error: { id: 'TR_TRADING_CANNOT_SEND_TRANSACTION' },
            });
            const { store, result } = renderActions();

            const success = await result.current.sendTransaction();

            expect(success).toBe(false);
            expect(toastsOf(store.getActions())).toHaveLength(1);
        });

        it('returns false without dispatching when the account is missing', async () => {
            const { result } = renderActions({ accountKey: undefined, accounts: [] });

            const success = await result.current.sendTransaction();

            expect(success).toBe(false);
            expect(mockSendTransactionThunk).not.toHaveBeenCalled();
        });
    });

    describe('confirmTrade', () => {
        it('dispatches confirmTradeThunk with the active account and forwarded props', async () => {
            const { result } = renderActions();

            const confirmed = await result.current.confirmTrade({
                receiveAddress: '0xReceiveAddress',
                extraField: 'destination-tag',
                trade: SELECTED_QUOTE,
            });

            expect(confirmed).toBe(CONFIRMED_TRADE);
            expect(mockConfirmTradeThunk).toHaveBeenCalledTimes(1);
            const [args] = mockConfirmTradeThunk.mock.calls[0] as [
                {
                    account: Account;
                    receiveAddress: string;
                    extraField?: string;
                    trade?: ExchangeTrade;
                    returnUrl: string;
                },
            ];

            expect(args.account).toBe(ACCOUNT);
            expect(args.receiveAddress).toBe('0xReceiveAddress');
            expect(args.extraField).toBe('destination-tag');
            expect(args.trade).toBe(SELECTED_QUOTE);
            expect(args.returnUrl).toBe('https://return.url');
        });

        it('falls back to the stored extraField when the caller does not pass one', async () => {
            const { result } = renderActions({ extraField: 'destination-tag' });

            await result.current.confirmTrade({
                receiveAddress: '0xReceiveAddress',
                trade: SELECTED_QUOTE,
            });

            expect(mockConfirmTradeThunk).toHaveBeenCalledTimes(1);
            const [args] = mockConfirmTradeThunk.mock.calls[0] as [{ extraField?: string }];

            expect(args.extraField).toBe('destination-tag');
        });

        it('forwards the approvalFlow flag to confirmTradeThunk', async () => {
            const { result } = renderActions();

            await result.current.confirmTrade({
                receiveAddress: '0xReceiveAddress',
                trade: SELECTED_QUOTE,
                approvalFlow: true,
            });

            expect(mockConfirmTradeThunk).toHaveBeenCalledTimes(1);
            const [args] = mockConfirmTradeThunk.mock.calls[0] as [{ approvalFlow?: boolean }];

            expect(args.approvalFlow).toBe(true);
        });

        it('returns undefined without dispatching when the account is missing', async () => {
            const { result } = renderActions({ accountKey: undefined, accounts: [] });

            const confirmed = await result.current.confirmTrade({
                receiveAddress: '0xReceiveAddress',
                trade: SELECTED_QUOTE,
            });

            expect(confirmed).toBeUndefined();
            expect(mockConfirmTradeThunk).not.toHaveBeenCalled();
        });
    });

    describe('signDataAndConfirm', () => {
        it('dispatches signDataAndConfirmThunk with the active account', async () => {
            const { result } = renderActions();

            await result.current.signDataAndConfirm();

            expect(mockSignDataAndConfirmThunk).toHaveBeenCalledTimes(1);
            const [args] = mockSignDataAndConfirmThunk.mock.calls[0] as [{ account: Account }];

            expect(args.account).toBe(ACCOUNT);
        });

        it('does nothing when the account is missing', async () => {
            const { result } = renderActions({ accountKey: undefined, accounts: [] });

            await result.current.signDataAndConfirm();

            expect(mockSignDataAndConfirmThunk).not.toHaveBeenCalled();
        });
    });
});
