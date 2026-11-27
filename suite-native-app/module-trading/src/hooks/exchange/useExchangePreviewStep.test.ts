import { type Store } from '@reduxjs/toolkit';
import type { ExchangeTrade } from 'invity-api';

import { mockNetworksServices } from '@suite-common/networks/mocks';
import { selectTradingExchangeSelectedQuote, tradingExchangeActions } from '@suite-common/trading';
import { asAccountDescriptor } from '@suite-common/wallet-types';
import { events } from '@suite-native/analytics';
import { mockNativeAnalytics } from '@suite-native/analytics/mocks';
import { act } from '@suite-native/test-utils-store';
import {
    exchangeQuotes,
    getBtcAccount,
    getEthAccount,
    mercuryoFixedWorstQuote,
    oneInchFusionPlusWithEip712SignDataQuote,
} from '@suite-native/trading-fixtures';
import { type TradingRootState } from '@suite-native/trading-state';

import { useExchangePreviewStep } from './useExchangePreviewStep';
import {
    createTradingTestStore,
    renderHookWithTradingProvider,
} from '../../test-utils/tradingTestUtils';

const btc1Account = getBtcAccount({ descriptor: asAccountDescriptor('btc1normal') });
const eth1Account = getEthAccount({ descriptor: asAccountDescriptor('eth1normal') });

jest.mock('@react-navigation/native', () => ({
    ...jest.requireActual('@react-navigation/native'),
    useFocusEffect: (handler: () => void) => {
        require('react').useEffect(handler, [handler]);
    },
}));

jest.mock('@suite-native/alerts', () => ({
    useAlert: () => ({ showAlert: jest.fn(), hideAlert: jest.fn() }),
}));

jest.mock('../general/useCloseTradingFlow', () => ({
    useCloseTradingFlow: () => jest.fn(),
}));

const mockConfirmTrade = jest.fn().mockResolvedValue(false);
const mockAbortConfirmTrade = jest.fn();
let mockTxnErrorString: string | null = null;

jest.mock('./useExchangeFlow', () => ({
    useExchangeFlow: () => ({
        confirmTrade: mockConfirmTrade,
        abortConfirmTrade: mockAbortConfirmTrade,
        composeTradingTransaction: jest.fn(),
        get txnErrorString() {
            return mockTxnErrorString;
        },
    }),
}));

const mockAnalyticsReport = jest.fn();

const createStore = (selectedQuote: ExchangeTrade) =>
    createTradingTestStore({
        tradeType: 'exchange',
        overrides: {
            wallet: {
                trading: {
                    exchange: {
                        quotes: exchangeQuotes,
                        tradingAccountKey: eth1Account.key,
                        receiveAccountKey: btc1Account.key,
                        receiveAddress: btc1Account.addresses?.used[0]?.address,
                        selectedQuote,
                    },
                },
            },
        },
    });

describe('useExchangePreviewStep', () => {
    let store: Store<TradingRootState>;
    const onApprovalRequired = jest.fn();

    const renderPreviewStepHook = () =>
        renderHookWithTradingProvider(() => useExchangePreviewStep({ onApprovalRequired }), {
            services: {
                analytics: mockNativeAnalytics(mockAnalyticsReport),
                store,
                networks: mockNetworksServices(),
            },
            tradeType: 'exchange',
        });

    beforeEach(() => {
        jest.clearAllMocks();
        mockTxnErrorString = null;
        store = createStore(mercuryoFixedWorstQuote);
    });

    it('confirms the trade on focus and reports the visit', async () => {
        await renderPreviewStepHook();

        expect(mockConfirmTrade).toHaveBeenCalledTimes(1);
        expect(mockAnalyticsReport).toHaveBeenCalledWith({
            type: events.tradingExchangeEvent.name,
            payload: expect.objectContaining({ step: 'transaction-preview', action: 'visit' }),
        });
    });

    it('returns the transaction error', async () => {
        mockTxnErrorString = 'Insufficient funds';

        const { result } = await renderPreviewStepHook();

        expect(result.current.errorString).toBe('Insufficient funds');
    });

    it('ignores the transaction error for EIP-712 signing', async () => {
        mockTxnErrorString = 'Insufficient funds';
        store = createStore(oneInchFusionPlusWithEip712SignDataQuote);

        const { result } = await renderPreviewStepHook();

        expect(result.current.errorString).toBeNull();
    });

    it('requests an approval only when the quote requires it', async () => {
        await renderPreviewStepHook();

        expect(onApprovalRequired).not.toHaveBeenCalled();

        await act(() =>
            store.dispatch(
                tradingExchangeActions.saveSelectedQuote({
                    ...mercuryoFixedWorstQuote,
                    status: 'APPROVAL_REQ',
                }),
            ),
        );

        expect(onApprovalRequired).toHaveBeenCalledTimes(1);
    });

    it('reports the continue action on the sign transaction navigation', async () => {
        const { result } = await renderPreviewStepHook();

        await act(() => result.current.onSignTransactionNavigation());

        expect(mockAnalyticsReport).toHaveBeenCalledWith({
            type: events.tradingExchangeEvent.name,
            payload: expect.objectContaining({
                step: 'transaction-preview',
                action: 'continue',
            }),
        });
    });

    it('aborts the trade confirmation on unmount but keeps the selected quote', async () => {
        const { unmount } = await renderPreviewStepHook();

        await unmount();

        expect(mockAbortConfirmTrade).toHaveBeenCalledTimes(1);
        expect(selectTradingExchangeSelectedQuote(store.getState())).toEqual(
            mercuryoFixedWorstQuote,
        );
    });
});
