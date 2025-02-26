import { useEffect } from 'react';
import { useStore } from 'react-redux';

import TrezorConnect from '@trezor/connect';

/**
 * Utility for running tests in Playwright.
 * Used to augment window object with redux store and TrezorConnect instance to make it accessible in tests
 */
export const usePlaywright = () => {
    const store = useStore();

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
