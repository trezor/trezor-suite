import { useEffect } from 'react';
import TrezorConnect from '@trezor/connect';
import { useStore } from 'react-redux';

/**
 * Utility for running tests in Cypress.
 * Used to augment window object with redux store and TrezorConnect instance to make it accessible in tests
 */
export const useCypress = () => {
    const store = useStore();

    useEffect(() => {
        if (typeof window !== 'undefined' && window.Cypress) {
            window.store = store;
            window.TrezorConnect = TrezorConnect;

            return () => {
                delete window.store;
                delete window.TrezorConnect;
            };
        }
    }, [store]);
};
