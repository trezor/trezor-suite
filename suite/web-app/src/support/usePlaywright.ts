import { useEffect } from 'react';

import { useServices } from '@suite-common/dependency-injection';
import { selectStore } from '@suite-common/redux-utils';
import TrezorConnect from '@trezor/connect';

/**
 * Utility for running tests in Playwright.
 * Used to augment window object with redux store and TrezorConnect instance to make it accessible in tests
 */
export const usePlaywright = () => {
    const { store } = useServices(selectStore);

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
