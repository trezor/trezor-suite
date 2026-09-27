import { type ReactNode, useState } from 'react';

import { act, renderHookWithBasicProvider } from '@suite-native/test-utils';

import { useNativeSheetAutoFocus } from './useNativeSheetAutoFocus';
import { NativeSheetContext, NativeSheetPresentationContext } from '../Sheet/NativeSheetContext';

describe('useNativeSheetAutoFocus', () => {
    const focus = jest.fn();
    const inputRef = { current: { focus } };

    beforeEach(() => focus.mockClear());

    const wrapper = (isNative: boolean, isPresented: boolean) =>
        function SheetProvider({ children }: { children: ReactNode }) {
            return (
                <NativeSheetContext.Provider value={isNative}>
                    <NativeSheetPresentationContext.Provider value={isPresented}>
                        {children}
                    </NativeSheetPresentationContext.Provider>
                </NativeSheetContext.Provider>
            );
        };

    it('preserves platform autofocus outside native sheets', async () => {
        const { result } = await renderHookWithBasicProvider(
            () => useNativeSheetAutoFocus(inputRef, true),
            { wrapper: wrapper(false, false) },
        );

        expect(result.current).toBe(true);
        expect(focus).not.toHaveBeenCalled();
    });

    it('does not focus while the native window is still opening', async () => {
        const { result } = await renderHookWithBasicProvider(
            () => useNativeSheetAutoFocus(inputRef, true),
            { wrapper: wrapper(true, false) },
        );

        expect(result.current).toBe(false);
        expect(focus).not.toHaveBeenCalled();
    });

    it('focuses once when the native sheet finishes presenting', async () => {
        let present = () => {};
        const PresentationProvider = ({ children }: { children: ReactNode }) => {
            const [isPresented, setIsPresented] = useState(false);
            present = () => setIsPresented(true);

            return (
                <NativeSheetContext.Provider value>
                    <NativeSheetPresentationContext.Provider value={isPresented}>
                        {children}
                    </NativeSheetPresentationContext.Provider>
                </NativeSheetContext.Provider>
            );
        };
        const { result, rerender } = await renderHookWithBasicProvider(
            () => useNativeSheetAutoFocus(inputRef, true),
            { wrapper: PresentationProvider },
        );
        expect(focus).not.toHaveBeenCalled();
        await act(() => present());
        await rerender(undefined);

        expect(result.current).toBe(false);
        expect(focus).toHaveBeenCalledTimes(1);
    });

    it('does not focus a native sheet input without autofocus', async () => {
        await renderHookWithBasicProvider(() => useNativeSheetAutoFocus(inputRef, false), {
            wrapper: wrapper(true, true),
        });

        expect(focus).not.toHaveBeenCalled();
    });
});
