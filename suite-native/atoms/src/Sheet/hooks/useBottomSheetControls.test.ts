import { Keyboard } from 'react-native';

import { act, renderHookWithBasicProvider } from '@suite-native/test-utils';

import { useBottomSheetControls } from './useBottomSheetControls';

describe('useBottomSheetControls', () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    describe('isSheetVisible', () => {
        it('should be false by default', async () => {
            const { result } = await renderHookWithBasicProvider(() => useBottomSheetControls());

            expect(result.current.isSheetVisible).toBe(false);
        });

        it('should be true after showSheet call and Keyboard.dismiss should be called one time', async () => {
            const { result } = await renderHookWithBasicProvider(() => useBottomSheetControls());
            const keyboardDismissSpy = jest.spyOn(Keyboard, 'dismiss');

            await act(() => {
                result.current.showSheet();
            });

            expect(keyboardDismissSpy).toHaveBeenCalledTimes(1);
            expect(result.current.isSheetVisible).toBe(true);
        });

        it('should be false after hideSheet call and Keyboard.dismiss should be called two times by default', async () => {
            const { result } = await renderHookWithBasicProvider(() => useBottomSheetControls());
            const keyboardDismissSpy = jest.spyOn(Keyboard, 'dismiss');

            await act(() => {
                result.current.showSheet();
                result.current.hideSheet();
            });

            expect(keyboardDismissSpy).toHaveBeenCalledTimes(2);
            expect(result.current.isSheetVisible).toBe(false);
        });

        it('should be false after hideSheet call with shouldHideKeyboard=true and Keyboard.dismiss should be called two times', async () => {
            const { result } = await renderHookWithBasicProvider(() => useBottomSheetControls());
            const keyboardDismissSpy = jest.spyOn(Keyboard, 'dismiss');

            await act(() => {
                result.current.showSheet();
                result.current.hideSheet(true);
            });

            expect(keyboardDismissSpy).toHaveBeenCalledTimes(2);
            expect(result.current.isSheetVisible).toBe(false);
        });

        it('should be false after hideSheet call with shouldHideKeyboard=false and Keyboard.dismiss should be called only once', async () => {
            const { result } = await renderHookWithBasicProvider(() => useBottomSheetControls());
            const keyboardDismissSpy = jest.spyOn(Keyboard, 'dismiss');

            await act(() => {
                result.current.showSheet();
                result.current.hideSheet(false);
            });

            expect(keyboardDismissSpy).toHaveBeenCalledTimes(1);
            expect(result.current.isSheetVisible).toBe(false);
        });
    });
});
