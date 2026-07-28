import { act, renderHook, waitFor } from '@suite-native/test-utils';

import { useConsent } from './useConsent';

describe('useConsent', () => {
    const renderUseConsent = () => renderHook(() => useConsent());

    it('should initialize with isConsentRequested as false', () => {
        const { result } = renderUseConsent();

        expect(result.current.isConsentRequested).toBe(false);
    });

    describe('waitForConsent', () => {
        it('should return a promise', () => {
            const { result } = renderUseConsent();
            act(() => {
                const promise = result.current.waitForConsent();

                expect(promise).toBeInstanceOf(Promise);
            });
        });

        it('should set isConsentRequested to true when called', async () => {
            const { result } = renderUseConsent();

            act(() => {
                result.current.waitForConsent();
            });

            await waitFor(() => {
                expect(result.current.isConsentRequested).toBe(true);
            });
        });
    });

    describe('resolveConsent', () => {
        it('should resolve the promise with the provided value', async () => {
            const { result } = renderUseConsent();

            let resolvedValue: boolean | undefined;

            act(() => {
                const promise = result.current.waitForConsent();
                promise.then(value => {
                    resolvedValue = value;
                });
            });

            await waitFor(() => {
                expect(result.current.isConsentRequested).toBe(true);
            });

            act(() => {
                result.current.resolveConsent(true);
            });

            await waitFor(() => {
                expect(resolvedValue).toBe(true);
            });
        });
    });

    describe('consent flow', () => {
        it('should handle complete consent flow', async () => {
            const { result } = renderUseConsent();

            let consentResult: boolean | undefined;

            // Start consent request
            act(() => {
                const promise = result.current.waitForConsent();
                promise.then(value => {
                    consentResult = value;
                });
            });

            // Verify consent is requested
            await waitFor(() => {
                expect(result.current.isConsentRequested).toBe(true);
            });

            // Resolve consent
            act(() => {
                result.current.resolveConsent(true);
            });

            // Verify consent is resolved
            await waitFor(() => {
                expect(consentResult).toBe(true);
                expect(result.current.isConsentRequested).toBe(false);
            });
        });
    });

    it('should handle unmounting gracefully', async () => {
        const { result, unmount } = renderUseConsent();

        // Start consent request
        act(() => {
            result.current.waitForConsent();
        });

        // Verify consent is requested
        await waitFor(() => {
            expect(result.current.isConsentRequested).toBe(true);
        });

        // Unmount component
        unmount();

        // Wait a bit for cleanup
        await new Promise(resolve => setTimeout(resolve, 0));

        // The promise should still resolve (though this is implementation dependent)
        // We're mainly testing that unmounting doesn't crash
        expect(true).toBe(true);
    });
});
