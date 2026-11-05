import { useEffect } from 'react';

import TrezorConnect from '@trezor/connect';
import { useServices } from '@trezor/dependency-injection';
import { injectStore } from '@trezor/redux-utils';

/**
 * Utility for running tests in Playwright.
 * Used to augment window object with redux store and TrezorConnect instance to make it accessible in tests
 */
export const usePlaywright = () => {
    const { store } = useServices(injectStore);

    useEffect(() => {
        if (typeof window !== 'undefined' && window.Playwright) {
            window.store = store;
            window.TrezorConnect = TrezorConnect;

            return () => {
                delete window.store;
                delete window.TrezorConnect;
            };
        }
    }, [store]);
};
