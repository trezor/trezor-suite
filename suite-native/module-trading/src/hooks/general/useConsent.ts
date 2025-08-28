import { useCallback, useEffect, useRef, useState } from 'react';

/**
 * This hook is used to handle consent requests.
 * on requested, it will return a promise that will be resolved when the consent is given or cancelled.
 * on given, it will resolve the promise with true.
 * on cancelled, it will resolve the promise with false.
 * on unmount, it will resolve the promise with false.
 */
export const useConsent = () => {
    const [isConsentRequested, setIsConsentRequested] = useState(false);

    const consentResolverRef = useRef<((confirmed: boolean) => void) | null>(null);

    const resolveConsent = useCallback((approved: boolean) => {
        setIsConsentRequested(false);
        consentResolverRef.current?.(approved);
        consentResolverRef.current = null;
    }, []);

    const waitForConsent = useCallback((): Promise<boolean> => {
        consentResolverRef.current?.(false);
        consentResolverRef.current = null;
        setIsConsentRequested(true);

        return new Promise(resolve => {
            consentResolverRef.current = resolve;
        });
    }, []);

    useEffect(
        () => () => {
            consentResolverRef.current?.(false);
        },
        [],
    );

    return { isConsentRequested, waitForConsent, resolveConsent };
};
