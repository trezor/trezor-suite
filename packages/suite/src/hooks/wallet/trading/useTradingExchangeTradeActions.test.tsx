import type { CryptoId, ExchangeTrade } from 'invity-api';

import { locksInitialState } from '@suite/locks';
import { type TrezorDevice } from '@suite-common/suite-types';
import { mockSuiteDevice } from '@suite-common/suite-types/mocks';
import {
    act,
    createTestCompositionRoot,
    renderHookWithStoreProvider,
} from '@suite-common/test-utils';
import { notificationsActions } from '@suite-common/toast-notifications';
import {
    type TradingError,
    exchangeInitialState,
    tradingExchangeActions,
    initialState as tradingInitialState,
} from '@suite-common/trading';
import { asNetworkSymbol } from '@suite-common/wallet-config';
import { type Account } from '@suite-common/wallet-types';
import { mockWalletAccount } from '@suite-common/wallet-types/mocks';

import { useTradingExchangeTradeActions } from './useTradingExchangeTradeActions';
import { type MockSuiteState } from '../../../../mocks/mockInitialAppState';

jest.mock('@suite/intl', () => ({
    ...jest.requireActual('@suite/intl'),
    useTranslation: () => ({ translationString: (id: string) => id }),
}));

jest.mock('#src/hooks/wallet/useBitcoinAmountUnit', () => ({
    useBitcoinAmountUnit: () => ({ isBtcSatsAmountUnit: false }),
}));

jest.mock('#src/hooks/wallet/trading/form/common/useTradingAssetDecimals', () => ({
    useTradingAssetDecimals: () => ({ getAssetDecimals: () => 8 }),
}));

const mockUseTradingFormAccount = jest.fn();
jest.mock('#src/hooks/wallet/trading/form/useTradingFormAccount', () => ({
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

jest.mock('#src/hooks/wallet/trading/form/common/useTradingExchangeTradeRequest', () => ({
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
const FRESH_QUOTE = {
    quoteId: 'fresh-quote',
    exchange: 'lifi',
    swapSlippage: '1',
} as ExchangeTrade;

const mockConfirmTradeThunk = jest.fn((args: unknown) =>
    Object.assign(
        () => ({ unwrap: () => Promise.resolve<ExchangeTrade | undefined>(CONFIRMED_TRADE) }),
        { args },
    ),
);
const mockSendTransactionThunk = jest.fn((args: unknown) =>
    Object.assign(() => ({ unwrap: () => Promise.resolve(true) }), { args }),
);
const mockSignDataAndConfirmThunk = jest.fn((args: unknown) =>
    Object.assign(() => Promise.resolve(), { args }),
);
const mockFetchSelectedProviderQuoteThunk = jest.fn(() => () => ({
    unwrap: () => Promise.resolve(FRESH_QUOTE),
}));

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
            fetchSelectedProviderQuoteThunk: () => mockFetchSelectedProviderQuoteThunk(),
        },
    };
});

const ACCOUNT = mockWalletAccount({ symbol: asNetworkSymbol('eth') });
const DEVICE = mockSuiteDevice({
    connected: true,
    available: true,
    state: { staticSessionId: ACCOUNT.deviceState, sessionId: 'before-reconnect' },
});
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
    selectedQuoteTimestamp?: number;
    accountKey?: Account['key'] | undefined;
    accounts?: Account[];
    selectedDevice?: TrezorDevice;
};

const buildState = (overrides: StateOverrides = {}) => {
    const selectedQuote = 'selectedQuote' in overrides ? overrides.selectedQuote : SELECTED_QUOTE;
    const accountKey = 'accountKey' in overrides ? overrides.accountKey : ACCOUNT.key;
    const accounts = 'accounts' in overrides ? overrides.accounts : [ACCOUNT];

    const overridesForExchange = {
        selectedQuote,
        selectedQuoteTimestamp: overrides.selectedQuoteTimestamp,
        tradingAccountKey: accountKey,
    };

    return {
        device: {
            selectedDevice: 'selectedDevice' in overrides ? overrides.selectedDevice : DEVICE,
        },
        locks: locksInitialState,
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

    const { services } = createTestCompositionRoot<void, MockSuiteState>({ preloadedState: state });
    const { result } = renderHookWithStoreProvider(() => useTradingExchangeTradeActions(), {
        services,
    });

    const { getActions } = services.store;

    return { getActions, result, store: services.store };
};

describe('useTradingExchangeTradeActions', () => {
    beforeEach(() => {
        mockConfirmTradeThunk.mockClear();
        mockSendTransactionThunk.mockClear();
        mockSignDataAndConfirmThunk.mockClear();
        mockFetchSelectedProviderQuoteThunk.mockClear();
        mockUseTradingFormAccount.mockReset();
    });

    describe('mount is side-effect free', () => {
        it('does not dispatch anything on mount', () => {
            const { getActions } = renderActions();

            expect(getActions()).toHaveLength(0);
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
                code: 'cannot-send-transaction',
            });
            const { getActions, result } = renderActions();

            const success = await result.current.sendTransaction();

            expect(success).toBe(false);
            expect(toastsOf(getActions())).toHaveLength(0);
        });

        it('reports an error nothing else has reported', async () => {
            rejectSendWith({
                type: 'sign-tx-error',
                code: 'cannot-send-transaction',
            });
            const { getActions, result } = renderActions();

            const success = await result.current.sendTransaction();

            expect(success).toBe(false);
            expect(toastsOf(getActions())).toHaveLength(1);
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
                trade: SELECTED_QUOTE,
            });

            expect(confirmed).toBe(CONFIRMED_TRADE);
            expect(mockConfirmTradeThunk).toHaveBeenCalledTimes(1);
            const [args] = mockConfirmTradeThunk.mock.calls[0] as [
                {
                    account: Account;
                    receiveAddress: string;
                    trade?: ExchangeTrade;
                    returnUrl: string;
                },
            ];

            expect(args.account).toBe(ACCOUNT);
            expect(args.receiveAddress).toBe('0xReceiveAddress');
            expect(args.trade).toBe(SELECTED_QUOTE);
            expect(args.returnUrl).toBe('https://return.url');
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

    describe('refreshSelectedQuote', () => {
        const EXPIRED_QUOTE: ExchangeTrade = {
            ...SELECTED_QUOTE,
            exchange: 'lifi',
            isDex: true,
            receiveAddress: 'SoLReceiveAddress',
            swapSlippage: '3',
        };
        const EXPIRED_QUOTE_TIMESTAMP = new Date('2026-10-23T10:00:00Z').getTime();

        it('confirms the fresh quote with the slippage of the expired one', async () => {
            const { result } = renderActions({
                selectedQuote: EXPIRED_QUOTE,
                selectedQuoteTimestamp: EXPIRED_QUOTE_TIMESTAMP,
            });

            const isRefreshed = await result.current.refreshSelectedQuote();

            expect(isRefreshed).toBe(true);
            expect(mockFetchSelectedProviderQuoteThunk).toHaveBeenCalledTimes(1);
            const [args] = mockConfirmTradeThunk.mock.calls[0] as [
                { receiveAddress: string; trade: ExchangeTrade },
            ];
            expect(args.receiveAddress).toBe('SoLReceiveAddress');
            expect(args.trade).toEqual({ ...FRESH_QUOTE, swapSlippage: '3' });
        });

        it('puts the expired quote back when the confirmation fails', async () => {
            mockConfirmTradeThunk.mockImplementationOnce((args: unknown) =>
                Object.assign(() => ({ unwrap: () => Promise.resolve(undefined) }), { args }),
            );
            const { getActions, result } = renderActions({
                selectedQuote: EXPIRED_QUOTE,
                selectedQuoteTimestamp: EXPIRED_QUOTE_TIMESTAMP,
            });

            const isRefreshed = await result.current.refreshSelectedQuote();

            expect(isRefreshed).toBe(false);
            expect(getActions()).toContainEqual(
                tradingExchangeActions.saveSelectedQuote(EXPIRED_QUOTE),
            );
            expect(getActions()).toContainEqual(
                tradingExchangeActions.setSelectedQuoteTimestamp(EXPIRED_QUOTE_TIMESTAMP),
            );
        });

        it('puts the expired quote back without another toast when the confirmation is rejected', async () => {
            const confirmTradeError: TradingError = { type: 'error', code: 'invalid-response' };
            mockConfirmTradeThunk.mockImplementationOnce((args: unknown) =>
                Object.assign(() => ({ unwrap: () => Promise.reject(confirmTradeError) }), {
                    args,
                }),
            );
            const { getActions, result } = renderActions({
                selectedQuote: EXPIRED_QUOTE,
                selectedQuoteTimestamp: EXPIRED_QUOTE_TIMESTAMP,
            });

            const isRefreshed = await result.current.refreshSelectedQuote();

            expect(isRefreshed).toBe(false);
            expect(getActions()).toContainEqual(
                tradingExchangeActions.saveSelectedQuote(EXPIRED_QUOTE),
            );
            expect(
                getActions().filter(action => action.type === notificationsActions.addToast.type),
            ).toHaveLength(0);
        });

        it('does nothing without a receive address on the selected quote', async () => {
            const { result } = renderActions({ selectedQuote: SELECTED_QUOTE });

            const isRefreshed = await result.current.refreshSelectedQuote();

            expect(isRefreshed).toBe(false);
            expect(mockFetchSelectedProviderQuoteThunk).not.toHaveBeenCalled();
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

        it('uses the reconnected device when signing resumes from the original click', async () => {
            const { result, store } = renderActions({
                selectedDevice: mockSuiteDevice({ ...DEVICE, connected: false, available: false }),
            });
            const { signDataAndConfirm } = result.current;
            const reconnected = mockSuiteDevice({
                connected: true,
                available: true,
                path: 'reconnected-path',
                state: { staticSessionId: ACCOUNT.deviceState, sessionId: 'after-reconnect' },
            });
            const previousState = store.getState();
            act(() => {
                store.replaceReducer(() => ({
                    ...previousState,
                    device: { ...previousState.device, selectedDevice: reconnected },
                }));
            });

            await signDataAndConfirm();

            expect(mockSignDataAndConfirmThunk).toHaveBeenCalledWith(
                expect.objectContaining({ device: reconnected }),
            );
        });

        it.each([
            ['disconnects', undefined],
            ['becomes unavailable', mockSuiteDevice({ ...DEVICE, available: false })],
            [
                'switches wallets',
                mockSuiteDevice({ ...DEVICE, state: { staticSessionId: 'other@device:0' } }),
            ],
        ] as const)(
            'stops when the selected device %s before signing',
            async (_, selectedDevice) => {
                const { result, getActions } = renderActions({ selectedDevice });

                await result.current.signDataAndConfirm();

                expect(mockSignDataAndConfirmThunk).not.toHaveBeenCalled();
                expect(getActions()).toContainEqual(
                    expect.objectContaining({
                        type: notificationsActions.addToast.type,
                        payload: expect.objectContaining({ error: 'TR_DEVICE_NOT_CONNECTED' }),
                    }),
                );
            },
        );

        it('does nothing when the account is missing', async () => {
            const { result } = renderActions({ accountKey: undefined, accounts: [] });

            await result.current.signDataAndConfirm();

            expect(mockSignDataAndConfirmThunk).not.toHaveBeenCalled();
        });
    });
});
