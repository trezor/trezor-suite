import { type RefObject } from 'react';
import { type TextInput } from 'react-native';

import { act, renderHook } from '@suite-native/test-utils';

import { useAssetSelectInputFocus } from './useAssetSelectInputFocus';

const createInputRef = (focus: jest.Mock): RefObject<TextInput | null> => ({
    current: { focus } as unknown as TextInput,
});

describe('useAssetSelectInputFocus', () => {
    beforeEach(() => {
        jest.useFakeTimers();
    });

    afterEach(() => {
        jest.useRealTimers();
    });

    it('should not focus an input requested after focusing was triggered', async () => {
        const focus = jest.fn();
        const { result } = await renderHook(() => useAssetSelectInputFocus());

        await act(() => {
            result.current.focusRequestedInput();
        });
        await act(() => {
            result.current.requestInputFocus(createInputRef(focus));
            jest.runAllTimers();
        });

        expect(focus).not.toHaveBeenCalled();
    });

    it('should focus the most recently requested input', async () => {
        const firstFocus = jest.fn();
        const secondFocus = jest.fn();
        const { result } = await renderHook(() => useAssetSelectInputFocus());

        await act(() => {
            result.current.requestInputFocus(createInputRef(firstFocus));
        });
        await act(() => {
            result.current.requestInputFocus(createInputRef(secondFocus));
        });
        await act(() => {
            result.current.focusRequestedInput();
            jest.runAllTimers();
        });

        expect(firstFocus).not.toHaveBeenCalled();
        expect(secondFocus).toHaveBeenCalledTimes(1);
    });
});
