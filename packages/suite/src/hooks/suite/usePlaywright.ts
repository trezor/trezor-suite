import { useEffect } from 'react';

import { useStore } from 'src/hooks/suite/useStore';

export const isRunningWithinPlaywright =
    typeof window !== 'undefined' &&
    // either of the properties can be present, depending on the Playwright environment
    (window.Playwright || !!window.playwright);

/**
 * Utility for running tests in Playwright.
 * Used to augment window object with redux store to make it accessible in tests.
 */
export const usePlaywright = () => {
    const store = useStore();

    useEffect(() => {
        if (isRunningWithinPlaywright) {
            window.store = store;

            return () => {
                delete window.store;
            };
        }
    }, [store]);
};
