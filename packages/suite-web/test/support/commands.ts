/* eslint-disable @typescript-eslint/no-namespace */
/* eslint-disable @typescript-eslint/no-var-requires */

import { DEVICE } from 'trezor-connect';
import { Store } from '@suite-types';
import { getConnectDevice } from '../../../suite/src/support/tests/setupJest';

const command = require('cypress-image-snapshot/command');

declare global {
    namespace Cypress {
        interface Chainable {
            getTestElement: typeof getTestElement;
            resetDb: typeof resetDb;
            dispatchDeviceConnect: typeof dispatchDeviceConnect;
            // todo: better types
            matchImageSnapshot: (options?: any) => Chainable<any>;
        }
    }
}

declare global {
    interface Window {
        // todo: hmm how to share store declaration with CypressExportStore.tsx?
        store: Store;
    }
}

command.addMatchImageSnapshotCommand({
    failureThreshold: 0.01, // threshold for entire image
    failureThresholdType: 'percent', // percent of image or number of pixels
});

/**
 * Clears databes. Use it to avoid persistence between tests
 *
 * @example cy.resetDb()
 */
export const resetDb = () => {
    indexedDB.deleteDatabase('trezor-suite');
    // todo: not sure if this is the correct way to make command chainable, probably not, will investigate
    return cy;
};

/**
 * Just like cy.get() but will return element specified with 'data-test=' attribute.
 *
 * @example cy.getTestElement('my-fancy-attr-name')
 */
export const getTestElement = (selector: string) => {
    return cy.get(`[data-test="${selector}"]`);
};

export const dispatchDeviceConnect = () => {
    return cy.wrap({
        type: DEVICE.CONNECT,
        payload: getConnectDevice(),
    });
};

Cypress.Commands.add('getTestElement', getTestElement);
Cypress.Commands.add('resetDb', { prevSubject: false }, resetDb);
Cypress.Commands.add('dispatchDeviceConnect', dispatchDeviceConnect);
