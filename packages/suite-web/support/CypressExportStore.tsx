import { useEffect } from 'react';
import { Store } from '@suite-types';

interface Props {
    store: Store;
}

/**
 * Utility for running tests in Cypress.
 * Used to augment window object with redux store to make it accessible in tests
 * @param {Store} store
 */
export const CypressExportStore = ({ store }: Props) => {
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
