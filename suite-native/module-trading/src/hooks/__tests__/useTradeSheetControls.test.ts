import { act, renderHook } from '@suite-native/test-utils';

import { useTradeSheetControls } from '../useTradeSheetControls';

describe('useTradeSheetControls', () => {
    describe('isSheetVisible', () => {
        it('should be false by default', () => {
            const { result } = renderHook(() => useTradeSheetControls<string>());

            expect(result.current.isSheetVisible).toBe(false);
        });

        it('should be true after showTradeableAssetsSheet call', () => {
            const { result } = renderHook(() => useTradeSheetControls());

            act(() => {
                result.current.showSheet();
            });

            expect(result.current.isSheetVisible).toBe(true);
        });

        it('should be false after hideTradeableAssetsSheet call', () => {
            const { result } = renderHook(() => useTradeSheetControls());

            act(() => {
                result.current.showSheet();
                result.current.hideSheet();
            });

            expect(result.current.isSheetVisible).toBe(false);
        });
    });

    describe('selectedTradeableAsset', () => {
        it('should be undefined by default', () => {
            const { result } = renderHook(() => useTradeSheetControls());

            expect(result.current.selectedValue).toBeUndefined();
        });

        it('should be set after setSelectedTradeableAsset call', () => {
            const { result } = renderHook(() => useTradeSheetControls());

            act(() => {
                result.current.setSelectedValue('btc');
            });

            expect(result.current.selectedValue).toBe('btc');
        });
    });
});
