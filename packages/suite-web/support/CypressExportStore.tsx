/* eslint-disable @typescript-eslint/no-namespace */

import { useEffect } from 'react';
import { Store } from '@suite-types';

interface Props {
    store?: Store;
}
declare global {
    interface Window {
        store: Store;
        // todo: Cypress property is added by test runner automatically. I just need it to decide
        // if store should be exposed on window object.
        Cypress: any;
    }
}

// todo: expose TrezorConnect on window to make its interface adjustable for tests;

/**
 * Utility for running tests in Cypress.
 * Used to augment window object with redux store to make it accessible in tests
 * @param {Store} store
 */
const CypressExportStore = ({ store }: Props) => {
    useEffect(() => {
        if (typeof window !== 'undefined' && window.Cypress && store) {
            window.store = store;
        }
        return () => {
            if (window.store) {
                delete window.store;
            }
        };
    }, [store]);

    return null;
};

export default CypressExportStore;
