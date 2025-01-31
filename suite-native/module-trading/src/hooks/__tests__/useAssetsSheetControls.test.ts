import { act, renderHook } from '@suite-native/test-utils';

import { useTradeableAssetsSheetControls } from '../useTradeableAssetsSheetControls';

describe('useTradeableAssetsSheetControls', () => {
    describe('isTradeableAssetsSheetVisible', () => {
        it('should be false by default', () => {
            const { result } = renderHook(() => useTradeableAssetsSheetControls());

            expect(result.current.isTradeableAssetsSheetVisible).toBe(false);
        });

        it('should be true after showTradeableAssetsSheet call', () => {
            const { result } = renderHook(() => useTradeableAssetsSheetControls());

            act(() => {
                result.current.showTradeableAssetsSheet();
            });

            expect(result.current.isTradeableAssetsSheetVisible).toBe(true);
        });

        it('should be false after hideTradeableAssetsSheet call', () => {
            const { result } = renderHook(() => useTradeableAssetsSheetControls());

            act(() => {
                result.current.showTradeableAssetsSheet();
                result.current.hideTradeableAssetsSheet();
            });

            expect(result.current.isTradeableAssetsSheetVisible).toBe(false);
        });
    });

    describe('selectedTradeableAsset', () => {
        it('should be undefined by default', () => {
            const { result } = renderHook(() => useTradeableAssetsSheetControls());

            expect(result.current.selectedTradeableAsset).toBeUndefined();
        });

        it('should be set after setSelectedTradeableAsset call', () => {
            const { result } = renderHook(() => useTradeableAssetsSheetControls());

            act(() => {
                result.current.setSelectedTradeableAsset({ symbol: 'btc' });
            });

            expect(result.current.selectedTradeableAsset?.symbol).toBe('btc');
        });
    });
});
