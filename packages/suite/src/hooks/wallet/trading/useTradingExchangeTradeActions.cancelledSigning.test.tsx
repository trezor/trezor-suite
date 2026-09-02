import type { CryptoId, ExchangeTrade } from 'invity-api';

import { createThunk } from '@suite-common/redux-utils';
import { createTestStore, renderHookWithStoreProvider } from '@suite-common/test-utils';
import { notificationsActions } from '@suite-common/toast-notifications';
import { exchangeInitialState, initialState as tradingInitialState } from '@suite-common/trading';
import { asNetworkSymbol } from '@suite-common/wallet-config';
import { composeSendFormTransactionFeeLevelsThunk } from '@suite-common/wallet-core';
import { mockWalletAccount } from '@suite-common/wallet-types/mocks';

import { useTradingExchangeTradeActions } from './useTradingExchangeTradeActions';

const DEVICE_CANCEL_TOAST_ERROR = 'Cancelled';

jest.mock('@suite-common/wallet-core', () => {
    const actual = jest.requireActual('@suite-common/wallet-core');
    const actualCompose = actual.composeSendFormTransactionFeeLevelsThunk;

    return {
        ...actual,
        composeSendFormTransactionFeeLevelsThunk: Object.assign(jest.fn(), {
            typePrefix: actualCompose.typePrefix,
            pending: actualCompose.pending,
            fulfilled: actualCompose.fulfilled,
            rejected: actualCompose.rejected,
        }),
    };
});

jest.mock('src/actions/wallet/send/sendFormThunks', () => ({
    ...jest.requireActual('src/actions/wallet/send/sendFormThunks'),
    signAndPushSendFormTransactionThunk: jest.fn(() => (dispatch: (action: unknown) => void) => {
        dispatch(
            notificationsActions.addToast({
                type: 'sign-tx-error',
                error: DEVICE_CANCEL_TOAST_ERROR,
            }),
        );

        return { unwrap: () => Promise.resolve(undefined) };
    }),
}));

jest.mock('@suite-common/trading', () => ({
    ...jest.requireActual('@suite-common/trading'),
    selectTradingIsSlip24Allowed: () => false,
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
    useTradingAssetDecimals: () => ({ getAssetDecimals: () => 18 }),
}));

jest.mock('@suite-common/message-system', () => ({
    ...jest.requireActual('@suite-common/message-system'),
    selectIsFeatureEnabled: () => false,
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

const ACCOUNT = mockWalletAccount({ symbol: asNetworkSymbol('eth') });

jest.mock('src/hooks/wallet/trading/form/useTradingFormAccount', () => ({
    useTradingFormAccount: () => ({
        tradingAccountKey: ACCOUNT.key,
        account: ACCOUNT,
        cryptoId: 'ethereum' as CryptoId,
    }),
}));

const SELECTED_QUOTE: ExchangeTrade = {
    quoteId: 'd369ba9e-7370-4a6e-87dc-aefd3851c735',
    orderId: 'orderId',
    exchange: 'changelly',
    send: 'ethereum' as CryptoId,
    receive: 'base--usdc' as CryptoId,
    sendStringAmount: '0.05',
    receiveStringAmount: '120',
    sendAddress: 'exchangeDepositAddress',
    status: 'CONFIRM',
};

const preloadedState = {
    wallet: {
        accounts: [ACCOUNT],
        fees: {
            [ACCOUNT.symbol]: {
                status: 'loaded',
                data: {
                    blockHeight: 1,
                    blockTime: 10,
                    minFee: 1,
                    maxFee: 100,
                    dustLimit: 0,
                    levels: [{ label: 'normal' as const, feePerUnit: '2', blocks: 2 }],
                },
            },
        },
        trading: {
            ...tradingInitialState,
            composedTransactionInfo: {
                composed: {
                    feePerByte: '2',
                    feeLimit: '21000',
                    estimatedFeeLimit: '21000',
                    fee: '42000',
                    token: undefined,
                    outputs: [],
                },
                selectedFee: 'normal' as const,
            },
            exchange: {
                ...exchangeInitialState,
                selectedQuote: SELECTED_QUOTE,
                tradingAccountKey: ACCOUNT.key,
            },
        },
    },
    device: {
        devices: [],
        selectedDevice: {
            connected: true,
            unavailableCapabilities: {},
            features: { major_version: 2, minor_version: 8, patch_version: 11 },
        },
    },
};

describe('cancelling a swap on the device', () => {
    beforeEach(() => {
        (composeSendFormTransactionFeeLevelsThunk as unknown as jest.Mock).mockImplementation(
            createThunk(
                composeSendFormTransactionFeeLevelsThunk.typePrefix,
                (_, { fulfillWithValue }) =>
                    fulfillWithValue({
                        normal: {
                            type: 'final',
                            totalSpent: '50000000000000000',
                            fee: '42000',
                            feePerByte: '2',
                            feeLimit: '21000',
                            estimatedFeeLimit: '21000',
                            bytes: 0,
                            inputs: [],
                            outputs: [{ amount: '50000000000000000' }],
                            outputsPermutation: [0],
                        },
                    }),
            ),
        );
    });

    afterEach(() => {
        jest.clearAllMocks();
    });

    it('reports the cancellation once and nothing else', async () => {
        const store = createTestStore({ extra: undefined, preloadedState });
        const { result } = renderHookWithStoreProvider(() => useTradingExchangeTradeActions(), {
            store,
        });

        const success = await result.current.sendTransaction();

        const toasts = store
            .getActions()
            .filter(action => action.type === notificationsActions.addToast.type);

        expect(success).toBe(false);
        expect(toasts).toHaveLength(1);
        expect(toasts[0]?.payload).toMatchObject({ error: DEVICE_CANCEL_TOAST_ERROR });
    });
});
