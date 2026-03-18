import { useSelector } from 'react-redux';

import { selectTradingExchangeActiveQuote, tradingExchangeActions } from '@suite-common/trading';
import {
    type TestStore,
    act,
    initStore,
    renderHookWithStoreProvider,
} from '@suite-native/test-utils';
import { exchangeQuotes, getWalletState } from '@suite-native/trading-fixtures';

import { useApprovalTypeControls } from '../useApprovalTypeControls';

describe('useApprovalTypeControls', () => {
    let store: TestStore;

    const renderUseApprovalTypeControls = () =>
        renderHookWithStoreProvider(
            () => {
                const quote = useSelector(selectTradingExchangeActiveQuote);

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

    it('should use INFINITE as default', () => {
        const { result } = renderUseApprovalTypeControls();

        expect(result.current).toEqual({
            approvalType: 'INFINITE',
            isSheetVisible: false,
            showSheet: expect.any(Function),
            hideSheet: expect.any(Function),
            handleApprovalTypeChange: expect.any(Function),
        });
        expect(selectTradingExchangeActiveQuote(store.getState())).toEqual(
            expect.objectContaining({ approvalType: 'INFINITE' }),
        );
    });

    it('should set new value with handleApprovalTypeChange', () => {
        const { result } = renderUseApprovalTypeControls();

        act(() => {
            result.current.handleApprovalTypeChange('MINIMAL');
        });

        expect(result.current).toEqual(
            expect.objectContaining({
                approvalType: 'MINIMAL',
            }),
        );
        expect(selectTradingExchangeActiveQuote(store.getState())).toEqual(
            expect.objectContaining({ approvalType: 'MINIMAL' }),
        );
    });

    it('should do nothing when no quote is provided', () => {
        store.dispatch(tradingExchangeActions.savePreselectedQuote(undefined));
        const { result } = renderUseApprovalTypeControls();

        expect(result.current).toEqual({
            approvalType: 'INFINITE',
            isSheetVisible: false,
            showSheet: expect.any(Function),
            hideSheet: expect.any(Function),
            handleApprovalTypeChange: expect.any(Function),
        });
        expect(selectTradingExchangeActiveQuote(store.getState())).toBeUndefined();

        act(() => {
            result.current.handleApprovalTypeChange('MINIMAL');
        });

        expect(result.current).toEqual(
            expect.objectContaining({
                approvalType: 'INFINITE',
            }),
        );
        expect(selectTradingExchangeActiveQuote(store.getState())).toBeUndefined();
    });
});
