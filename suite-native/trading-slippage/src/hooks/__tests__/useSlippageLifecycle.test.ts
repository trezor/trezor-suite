import {
    TRADING_SETTINGS_MAX_SLIPPAGE_PERCENTAGE_DEFAULT,
    selectTradingExchangeSelectedQuoteSwapSlippage,
    tradingExchangeActions,
} from '@suite-common/trading';
import { act } from '@suite-native/test-utils-store';
import { mercuryoDexQuote } from '@suite-native/trading-fixtures';

import {
    createSlippageTestStore,
    renderHookWithSlippageTestProvider,
} from '../../__tests__/testUtils';
import { useSlippageLifecycle } from '../useSlippageLifecycle';

const renderUseSlippageLifecycle = ({
    onSlippageChanged,
}: {
    onSlippageChanged: (slippage: string | undefined) => void;
}) => {
    const store = createSlippageTestStore({ ...mercuryoDexQuote, swapSlippage: undefined });
    const { result } = renderHookWithSlippageTestProvider(
        () => useSlippageLifecycle(onSlippageChanged),
        { store },
    );

    return { store, result };
};

describe('useSlippageLifecycle', () => {
    it('should set the selected quote slippage to the default value on mount', async () => {
        const { store } = renderUseSlippageLifecycle({
            onSlippageChanged: jest.fn(),
        });

        await act(() => Promise.resolve());

        expect(selectTradingExchangeSelectedQuoteSwapSlippage(store.getState())).toBe(
            TRADING_SETTINGS_MAX_SLIPPAGE_PERCENTAGE_DEFAULT,
        );
    });

    it('should not call onSlippageChanged on mount', async () => {
        const onSlippageChanged = jest.fn();
        renderUseSlippageLifecycle({ onSlippageChanged });

        await act(() => Promise.resolve());

        expect(onSlippageChanged).not.toHaveBeenCalled();
    });

    it('should call onSlippageChanged when the selected quote slippage changes after mount', async () => {
        const onSlippageChanged = jest.fn();
        const { store } = renderUseSlippageLifecycle({
            onSlippageChanged,
        });

        await act(() => Promise.resolve());
        onSlippageChanged.mockClear();

        act(() => {
            store.dispatch(tradingExchangeActions.setSelectedQuoteSwapSlippage('3'));
        });

        expect(onSlippageChanged).toHaveBeenCalledTimes(1);
        expect(onSlippageChanged).toHaveBeenCalledWith('3');
    });

    it('should not call onSlippageChanged when the dispatched slippage matches the current value', async () => {
        const onSlippageChanged = jest.fn();
        const { store } = renderUseSlippageLifecycle({
            onSlippageChanged,
        });

        await act(() => Promise.resolve());
        onSlippageChanged.mockClear();

        act(() => {
            store.dispatch(
                tradingExchangeActions.setSelectedQuoteSwapSlippage(
                    TRADING_SETTINGS_MAX_SLIPPAGE_PERCENTAGE_DEFAULT,
                ),
            );
        });

        expect(onSlippageChanged).not.toHaveBeenCalled();
    });
});
