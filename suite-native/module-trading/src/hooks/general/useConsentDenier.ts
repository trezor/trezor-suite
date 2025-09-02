import { useEffect, useRef } from 'react';

export const useConsentDenier = <T>(
    watchedValue: T,
    resolveConsent: (approved: false) => void,
): void => {
    const previousValueRef = useRef<T>(watchedValue);

    useEffect(() => {
        if (previousValueRef.current !== watchedValue) {
            resolveConsent(false);
        }
        previousValueRef.current = watchedValue;
    }, [watchedValue, resolveConsent]);
};
