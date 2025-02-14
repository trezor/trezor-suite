import { act, renderHook } from '@suite-native/test-utils';

import { useBottomSheetControls } from '../useBottomSheetControls';

describe('useBottomSheetControls', () => {
    describe('isSheetVisible', () => {
        it('should be false by default', () => {
            const { result } = renderHook(() => useBottomSheetControls());

            expect(result.current.isSheetVisible).toBe(false);
        });

        it('should be true after showTradeableAssetsSheet call', () => {
            const { result } = renderHook(() => useBottomSheetControls());

            act(() => {
                result.current.showSheet();
            });

            expect(result.current.isSheetVisible).toBe(true);
        });

        it('should be false after hideTradeableAssetsSheet call', () => {
            const { result } = renderHook(() => useBottomSheetControls());

            act(() => {
                result.current.showSheet();
                result.current.hideSheet();
            });

            expect(result.current.isSheetVisible).toBe(false);
        });
    });
});
