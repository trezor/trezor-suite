import { renderHook } from '@suite-native/test-utils';

import { useConsentDenier } from './useConsentDenier';

describe('useConsentDenier', () => {
    const renderConsentDenierHook = async <T>(
        initialValue: T,
        initialResolveConsent: (approved: false) => void,
    ) =>
        await renderHook<
            ReturnType<typeof useConsentDenier<T>>,
            { watchedValue: T; resolveConsent: (approved: false) => void }
        >(({ watchedValue, resolveConsent }) => useConsentDenier<T>(watchedValue, resolveConsent), {
            initialProps: {
                watchedValue: initialValue,
                resolveConsent: initialResolveConsent,
            },
        });

    it('should not call resolve callback on initial render', async () => {
        const resolveConsentMock = jest.fn();
        await renderConsentDenierHook(1, resolveConsentMock);

        expect(resolveConsentMock).not.toHaveBeenCalled();
    });

    it('should call resolveConsent with false when watchedValue changes', async () => {
        const resolveConsentMock = jest.fn();
        const { rerender } = await renderConsentDenierHook(1, resolveConsentMock);

        await rerender({ watchedValue: 2, resolveConsent: resolveConsentMock });

        expect(resolveConsentMock).toHaveBeenCalledWith(false);
    });

    it('should not call resolveConsent when watchedValue remains the same', async () => {
        const resolveConsentMock = jest.fn();
        const { rerender } = await renderConsentDenierHook(1, resolveConsentMock);

        await rerender({ watchedValue: 1, resolveConsent: resolveConsentMock });

        expect(resolveConsentMock).not.toHaveBeenCalled();
    });
});
