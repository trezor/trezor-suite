import { useEffect, FunctionComponent } from 'react';
import { DesktopApi } from '@trezor/suite/index.d';
import { Store } from '@suite-types';

declare global {
    interface Window {
        Cypress: any;
        store: Store;
        __REDUX_DEVTOOLS_EXTENSION_COMPOSE__: () => any | null;
        desktop_api: DesktopApi; // Electron API
    }
}

interface Props {
    store: any;
}

/**
 * expose store to window when run in Cypress
 * @param {Store} store
 */
const CypressExportStore: FunctionComponent<Props> = ({ store }) => {
    useEffect(() => {
        if (window && !window.store && window.Cypress) {
            window.store = store;
        }
        return () => {
            delete window.store;
        };
    });

    return null;
};

export default CypressExportStore;
