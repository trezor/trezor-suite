import { Keyboard } from 'react-native';

import { act, renderHookWithProviders } from '@suite-native/test-utils';

import { useBottomSheetControls } from '../useBottomSheetControls';

describe('useBottomSheetControls', () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    describe('isSheetVisible', () => {
        it('should be false by default', () => {
            const { result } = renderHookWithProviders(() => useBottomSheetControls(), {
                providers: ['intl', 'navigation', 'bottomSheet'],
            });

            expect(result.current.isSheetVisible).toBe(false);
        });

        it('should be true after showTradeableAssetsSheet call and Keyboard.dismiss should be called one time', () => {
            const { result } = renderHookWithProviders(() => useBottomSheetControls(), {
                providers: ['intl', 'navigation', 'bottomSheet'],
            });
            const keyboardDismissSpy = jest.spyOn(Keyboard, 'dismiss');

            act(() => {
                result.current.showSheet();
            });

            expect(keyboardDismissSpy).toHaveBeenCalledTimes(1);
            expect(result.current.isSheetVisible).toBe(true);
        });

        it('should be false after hideSheet call and Keyboard.dismiss should be called two times by default', () => {
            const { result } = renderHookWithProviders(() => useBottomSheetControls(), {
                providers: ['intl', 'navigation', 'bottomSheet'],
            });
            const keyboardDismissSpy = jest.spyOn(Keyboard, 'dismiss');

            act(() => {
                result.current.showSheet();
                result.current.hideSheet();
            });

            expect(keyboardDismissSpy).toHaveBeenCalledTimes(2);
            expect(result.current.isSheetVisible).toBe(false);
        });

        it('should be false after hideSheet call with shouldHideKeyboard=true and Keyboard.dismiss should be called two times', () => {
            const { result } = renderHookWithProviders(() => useBottomSheetControls(), {
                providers: ['intl', 'navigation', 'bottomSheet'],
            });
            const keyboardDismissSpy = jest.spyOn(Keyboard, 'dismiss');

            act(() => {
                result.current.showSheet();
                result.current.hideSheet(true);
            });

            expect(keyboardDismissSpy).toHaveBeenCalledTimes(2);
            expect(result.current.isSheetVisible).toBe(false);
        });

        it('should be false after hideSheet call with shouldHideKeyboard=false and Keyboard.dismiss should be called only once', () => {
            const { result } = renderHookWithProviders(() => useBottomSheetControls(), {
                providers: ['intl', 'navigation', 'bottomSheet'],
            });
            const keyboardDismissSpy = jest.spyOn(Keyboard, 'dismiss');

            act(() => {
                result.current.showSheet();
                result.current.hideSheet(false);
            });

            expect(keyboardDismissSpy).toHaveBeenCalledTimes(1);
            expect(result.current.isSheetVisible).toBe(false);
        });
    });
});
