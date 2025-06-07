import { renderHook } from '@suite-native/test-utils';

import { useInputFieldControls } from '../useInputFieldControls';

let mockUseField: jest.Mock;

jest.mock('@suite-native/forms', () => ({
    ...jest.requireActual('@suite-native/forms'),
    useField: (...props: unknown[]) => mockUseField(...props),
}));

describe('useInputFieldControls', () => {
    let mockOnChange: jest.Mock;
    let mockOnBlur: jest.Mock;
    let mockHasError: boolean;

    beforeEach(() => {
        mockOnChange = jest.fn();
        mockOnBlur = jest.fn();
        mockHasError = false;

        mockUseField = jest.fn(() => ({
            onChange: mockOnChange,
            onBlur: mockOnBlur,
            hasError: mockHasError,
        }));
    });

    it('should return given value', () => {
        const { result } = renderHook(() =>
            useInputFieldControls('testField', 'testValue', jest.fn()),
        );

        expect(result.current.value).toBe('testValue');
    });

    it('should return empty string when value is undefined', () => {
        const { result } = renderHook(() =>
            useInputFieldControls('testField', undefined, jest.fn()),
        );

        expect(result.current.value).toBe('');
    });

    it('should use onChange from useField', () => {
        const { result } = renderHook(() =>
            useInputFieldControls('testField', 'testValue', jest.fn()),
        );

        result.current.onChangeText('newValue');
        expect(mockOnChange).toHaveBeenCalledWith('newValue');
    });

    it('should use onBlur from useField', () => {
        const { result } = renderHook(() =>
            useInputFieldControls('testField', 'testValue', jest.fn()),
        );

        result.current.onBlur();
        expect(mockOnBlur).toHaveBeenCalled();
    });

    it('should set focusedValue on onFocus', () => {
        const mockSetValue = jest.fn();
        const { result } = renderHook(() =>
            useInputFieldControls('testField', 'testValue', mockSetValue),
        );

        result.current.onFocus();
        expect(mockSetValue).toHaveBeenCalledWith('focusedValue', 'testField');
    });

    it('should clear focusedValue and call onBlur on clearFocusedValueAndBlur', () => {
        const mockSetValue = jest.fn();
        const { result } = renderHook(() =>
            useInputFieldControls('testField', 'testValue', mockSetValue),
        );

        result.current.onBlur();

        expect(mockSetValue).toHaveBeenCalledWith('focusedValue', undefined);
        expect(mockOnBlur).toHaveBeenCalled();
    });

    it('should return hasError from useField', () => {
        mockHasError = true;
        const { result } = renderHook(() =>
            useInputFieldControls('testField', 'testValue', jest.fn()),
        );

        expect(result.current.hasError).toBe(true);
    });
});
