import { type Store } from '@reduxjs/toolkit';

import { mock } from '@suite-common/dependency-injection';
import { act } from '@suite-native/test-utils-store';
import { type TradingRootState, tradingActions } from '@suite-native/trading-state';

import { useTradingFormResetRequest } from './useTradingFormResetRequest';
import {
    createTradingTestStore,
    renderHookWithTradingProvider,
} from '../../../test-utils/tradingTestUtils';

describe('useTradingFormResetRequest', () => {
    let store: Store<TradingRootState>;

    const renderUseTradingFormResetRequest = (resetForm: () => void) =>
        renderHookWithTradingProvider(
            () => useTradingFormResetRequest({ tradeType: 'exchange', resetForm }),
            { services: { store } },
        );

    beforeEach(() => {
        store = createTradingTestStore();
    });

    it('should reset the form and clear the request when it is requested for its trade type', async () => {
        const resetForm = mock<() => void>();
        await renderUseTradingFormResetRequest(resetForm);

        await act(() => {
            store.dispatch(tradingActions.requestTradingFormReset('exchange'));
        });

        expect(resetForm).toHaveBeenCalledTimes(1);
        expect(store.getState().wallet.trading.formResetRequestedFor).toBeUndefined();
    });

    it('should not reset the form when it is requested for another trade type', async () => {
        const resetForm = mock<() => void>();
        await renderUseTradingFormResetRequest(resetForm);

        await act(() => {
            store.dispatch(tradingActions.requestTradingFormReset('buy'));
        });

        expect(resetForm).not.toHaveBeenCalled();
        expect(store.getState().wallet.trading.formResetRequestedFor).toBe('buy');
    });

    it('should handle a request that was made before mount', async () => {
        const resetForm = mock<() => void>();
        store.dispatch(tradingActions.requestTradingFormReset('exchange'));

        await renderUseTradingFormResetRequest(resetForm);

        expect(resetForm).toHaveBeenCalledTimes(1);
        expect(store.getState().wallet.trading.formResetRequestedFor).toBeUndefined();
    });
});
