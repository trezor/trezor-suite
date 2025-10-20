import { Keyboard } from 'react-native';

import { act, renderHookWithBasicProvider } from '@suite-native/test-utils';

import { useBottomSheetControls } from '../useBottomSheetControls';

describe('useBottomSheetControls', () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    describe('isSheetVisible', () => {
        it('should be false by default', () => {
            const { result } = renderHookWithBasicProvider(() => useBottomSheetControls());

            expect(result.current.isSheetVisible).toBe(false);
        });

        it('should be true after showTradeableAssetsSheet call and Keyboard.dismiss should be called one time', () => {
            const { result } = renderHookWithBasicProvider(() => useBottomSheetControls());
            const keyboardDismissSpy = jest.spyOn(Keyboard, 'dismiss');

            act(() => {
                result.current.showSheet();
            });

            expect(keyboardDismissSpy).toHaveBeenCalledTimes(1);
            expect(result.current.isSheetVisible).toBe(true);
        });

        it('should be false after hideTradeableAssetsSheet call and Keyboard.dismiss should be called one time', () => {
            const { result } = renderHookWithBasicProvider(() => useBottomSheetControls());
            const keyboardDismissSpy = jest.spyOn(Keyboard, 'dismiss');

            act(() => {
                result.current.showSheet();
                result.current.hideSheet();
            });

            expect(keyboardDismissSpy).toHaveBeenCalledTimes(1);
            expect(result.current.isSheetVisible).toBe(false);
        });
    });
});
