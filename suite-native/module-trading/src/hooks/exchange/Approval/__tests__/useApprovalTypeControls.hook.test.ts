import { useSelector } from 'react-redux';

import {
    selectTradingExchangePreselectedQuote,
    tradingExchangeActions,
} from '@suite-common/trading';
import {
    TestStore,
    act,
    initStore,
    renderHookWithStoreProviderAsync,
} from '@suite-native/test-utils';
import { exchangeQuotes, getWalletState } from '@suite-native/trading-fixtures';

import { useApprovalTypeControls } from '../useApprovalTypeControls';

describe('useApprovalTypeControls', () => {
    let store: TestStore;

    const renderUseApprovalTypeControls = () =>
        renderHookWithStoreProviderAsync(
            () => {
                const quote = useSelector(selectTradingExchangePreselectedQuote)!;

                return useApprovalTypeControls(quote);
            },
            { store },
        );

    beforeEach(() => {
        const preloadedState = {
            wallet: getWalletState({
                tradeType: 'exchange',
            }),
        };
        store = initStore(preloadedState).store;
        store.dispatch(tradingExchangeActions.savePreselectedQuote(exchangeQuotes[0]));
    });

    it('should use INFINITE as default', async () => {
        const { result } = await renderUseApprovalTypeControls();

        expect(result.current).toEqual({
            approvalType: 'INFINITE',
            isSheetVisible: false,
            showSheet: expect.any(Function),
            hideSheet: expect.any(Function),
            handleApprovalTypeChange: expect.any(Function),
        });
        expect(selectTradingExchangePreselectedQuote(store.getState())).toEqual(
            expect.objectContaining({ approvalType: 'INFINITE' }),
        );
    });

    it('should set new value with handleApprovalTypeChange', async () => {
        const { result } = await renderUseApprovalTypeControls();

        act(() => {
            result.current.handleApprovalTypeChange('MINIMAL');
        });

        expect(result.current).toEqual(
            expect.objectContaining({
                approvalType: 'MINIMAL',
            }),
        );
        expect(selectTradingExchangePreselectedQuote(store.getState())).toEqual(
            expect.objectContaining({ approvalType: 'MINIMAL' }),
        );
    });

    it('should do nothing when no preselected quote is provided', async () => {
        store.dispatch(tradingExchangeActions.savePreselectedQuote(undefined));
        const { result } = await renderUseApprovalTypeControls();

        expect(result.current).toEqual({
            approvalType: 'INFINITE',
            isSheetVisible: false,
            showSheet: expect.any(Function),
            hideSheet: expect.any(Function),
            handleApprovalTypeChange: expect.any(Function),
        });
        expect(selectTradingExchangePreselectedQuote(store.getState())).toBeUndefined();

        act(() => {
            result.current.handleApprovalTypeChange('MINIMAL');
        });

        expect(result.current).toEqual(
            expect.objectContaining({
                approvalType: 'INFINITE',
            }),
        );
        expect(selectTradingExchangePreselectedQuote(store.getState())).toBeUndefined();
    });
});
