import { AppState } from 'react-native';

import { act, renderHookWithProviders, screen } from '@suite-native/test-utils';

import { useOnForegroundCallback } from '../useOnForegroundCallback';

const mockCaptureSentryException = jest.fn();

jest.mock('@suite-native/sentry', () => ({
    captureSentryException: (...args: unknown[]) => mockCaptureSentryException(...args),
}));

describe('useOnForegroundCallback', () => {
    const mockCallback = jest.fn();
    const appStateSpy = jest.spyOn(AppState, 'addEventListener');

    const renderUseOnFocusCallback = () =>
        renderHookWithProviders(() => useOnForegroundCallback(mockCallback), {
            providers: ['intl'],
        });

    beforeEach(() => {
        jest.clearAllMocks();
    });

    afterEach(() => {
        screen.unmount();
    });

    it('should only subscribe for app state changes on mount', () => {
        const { result } = renderUseOnFocusCallback();

        expect(appStateSpy).toHaveBeenCalledWith('change', expect.any(Function));
        expect(result.current.shouldWatchForForeground).toBe(false);
        expect(mockCallback).toHaveBeenCalledTimes(0);
    });

    it('should call callback once when app state is active and shouldWatchForForeground is set to true', () => {
        const { result } = renderUseOnFocusCallback();
        const changeHandler = appStateSpy.mock.calls[0][1];

        act(() => {
            // simulate app being in foreground
            changeHandler('active');
            result.current.setShouldWatchForForeground(true);
        });

        expect(mockCallback).toHaveBeenCalledTimes(1);
        expect(result.current.shouldWatchForForeground).toBe(false);
    });

    it('should not call callback when app is on background and shouldWatchForForeground is set to true ', () => {
        const { result } = renderUseOnFocusCallback();
        const changeHandler = appStateSpy.mock.calls[0][1];

        act(() => {
            // simulate app going to background
            changeHandler('active');
            changeHandler('background');
            // and start watching for foreground again
            result.current.setShouldWatchForForeground(true);
        });

        expect(mockCallback).toHaveBeenCalledTimes(0);
        expect(result.current.shouldWatchForForeground).toBe(true);
    });

    it('should react to app state changes', () => {
        const { result } = renderUseOnFocusCallback();
        const changeHandler = appStateSpy.mock.calls[0][1];

        act(() => {
            // simulate app going to background
            changeHandler('active');
            changeHandler('background');
            // and start watching for foreground again
            result.current.setShouldWatchForForeground(true);
            // then app coming back to foreground
            changeHandler('active');
        });

        expect(mockCallback).toHaveBeenCalledTimes(1);
        expect(result.current.shouldWatchForForeground).toBe(false);
    });

    it('should catch errors in callback', async () => {
        const consoleWarnSpy = jest.spyOn(console, 'warn').mockImplementation(() => {});
        const { result } = renderUseOnFocusCallback();
        const changeHandler = appStateSpy.mock.calls[0][1];
        const error = new Error('Test error');

        mockCallback.mockRejectedValueOnce(error);

        await act(async () => {
            result.current.setShouldWatchForForeground(true);
            await changeHandler('active');
        });

        expect(mockCallback).toHaveBeenCalledTimes(1);
        expect(consoleWarnSpy).toHaveBeenCalledWith(
            'Callback provided to useOnForegroundCallback threw an error. It should be handled inside the callback itself.',
            error,
        );
        expect(mockCaptureSentryException).toHaveBeenCalledWith(
            expect.objectContaining({
                message: 'Error thrown in callback provided to useOnForegroundCallback',
                cause: error,
            }),
        );
    });
});
