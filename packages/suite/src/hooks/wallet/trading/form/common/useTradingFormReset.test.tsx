import { renderHook } from '@testing-library/react';

import { useTradingFormReset } from './useTradingFormReset';

type Values = { cryptoSelect: string; receiveAddress?: string };

const defaultValues: Values = { cryptoSelect: 'btc', receiveAddress: undefined };

describe('useTradingFormReset', () => {
    it('resets once when info becomes ready after mounting without info', () => {
        const reset = jest.fn();

        const { rerender } = renderHook(
            ({ isInfoReady }) => useTradingFormReset({ isInfoReady, reset, defaultValues }),
            { initialProps: { isInfoReady: false } },
        );

        expect(reset).not.toHaveBeenCalled();

        rerender({ isInfoReady: true });

        expect(reset).toHaveBeenCalledTimes(1);
        expect(reset).toHaveBeenCalledWith(defaultValues);

        rerender({ isInfoReady: true });

        expect(reset).toHaveBeenCalledTimes(1);
    });

    it('does not reset when info is already ready at mount', () => {
        const reset = jest.fn();

        renderHook(() => useTradingFormReset({ isInfoReady: true, reset, defaultValues }));

        expect(reset).not.toHaveBeenCalled();
    });

    it('merges preserved values over the defaults on reset', () => {
        const reset = jest.fn();

        const { rerender } = renderHook(
            ({ isInfoReady }) =>
                useTradingFormReset({
                    isInfoReady,
                    reset,
                    defaultValues,
                    getPreservedValues: () => ({ receiveAddress: 'preserved-address' }),
                }),
            { initialProps: { isInfoReady: false } },
        );

        rerender({ isInfoReady: true });

        expect(reset).toHaveBeenCalledWith({
            ...defaultValues,
            receiveAddress: 'preserved-address',
        });
    });
});
