import { renderHook } from '@suite-native/test-utils';

import { useConsentDenier } from './useConsentDenier';

describe('useConsentDenier', () => {
    const renderConsentDenierHook = <T>(
        initialValue: T,
        initialResolveConsent: (approved: false) => void,
    ) =>
        renderHook<
            ReturnType<typeof useConsentDenier<T>>,
            { watchedValue: T; resolveConsent: (approved: false) => void }
        >(({ watchedValue, resolveConsent }) => useConsentDenier<T>(watchedValue, resolveConsent), {
            initialProps: {
                watchedValue: initialValue,
                resolveConsent: initialResolveConsent,
            },
        });

    it('should not call resolve callback on initial render', () => {
        const resolveConsentMock = jest.fn();
        renderConsentDenierHook(1, resolveConsentMock);

        expect(resolveConsentMock).not.toHaveBeenCalled();
    });

    it('should call resolveConsent with false when watchedValue changes', () => {
        const resolveConsentMock = jest.fn();
        const { rerender } = renderConsentDenierHook(1, resolveConsentMock);

        rerender({ watchedValue: 2, resolveConsent: resolveConsentMock });

        expect(resolveConsentMock).toHaveBeenCalledWith(false);
    });

    it('should not call resolveConsent when watchedValue remains the same', () => {
        const resolveConsentMock = jest.fn();
        const { rerender } = renderConsentDenierHook(1, resolveConsentMock);

        rerender({ watchedValue: 1, resolveConsent: resolveConsentMock });

        expect(resolveConsentMock).not.toHaveBeenCalled();
    });
});
