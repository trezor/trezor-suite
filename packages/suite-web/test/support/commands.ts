/* eslint-disable @typescript-eslint/no-namespace */
/* eslint-disable @typescript-eslint/no-var-requires */
import TrezorConnect, { DEVICE, Device, Features } from 'trezor-connect';
import { Store, AppState } from '@suite-types';

// import { getConnectDevice } from '../../../suite/src/support/tests/setupJest';
// import { DEVICE } from 'trezor-connect';
import { getConnectDevice, getDeviceFeatures } from '../../../suite/src/support/tests/setupJest';

const command = require('cypress-image-snapshot/command');

declare global {
    namespace Cypress {
        interface Chainable<Subject> {
            getTestElement: typeof getTestElement;
            resetDb: typeof resetDb;
            // todo: better types
            matchImageSnapshot: (options?: any) => Chainable<any>;
            connectDevice: (
                device?: Partial<Device>,
                features?: Partial<Features>,
            ) => Chainable<any>;
            changeDevice: (
                path: string,
                device?: Partial<Device>,
                features?: Partial<Features>,
            ) => Chainable<any>;
            setState: (state: Partial<AppState>) => undefined;
            onboardingShouldLoad: () => Chainable<Subject>;
        }
    }
}

declare global {
    interface Window {
        store: Store;
        TrezorConnect: typeof TrezorConnect;
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
const resetDb = () => {
    indexedDB.deleteDatabase('trezor-suite');
    // todo: not sure if this is the correct way to make command chainable, probably not, will investigate
    return cy;
};

/**
 * Just like cy.get() but will return element specified with 'data-test=' attribute.
 *
 * @example cy.getTestElement('my-fancy-attr-name')
 */
const getTestElement = (selector: string) => {
    return cy.get(`[data-test="${selector}"]`);
};

const setState = (state: Partial<AppState>) => {
    cy.window()
        .its('store')
        .should('exist');
    return cy.window().then(window => {
        window.store.getState().onboarding = {
            ...window.store.getState().onboarding,
            ...state.onboarding,
        };
    });
};

const connectDevice = (device?: Partial<Device>, features?: Partial<Features>) => {
    return cy
        .window()
        .its('store')
        .invoke('dispatch', {
            type: DEVICE.CONNECT,
            payload: getConnectDevice(device, getDeviceFeatures(features)),
        });
};

const changeDevice = (path: string, device?: Partial<Device>, features?: Partial<Features>) => {
    console.warn('change device', JSON.stringify(device));
    cy.window()
        .its('store')
        .invoke('dispatch', {
            type: DEVICE.CHANGED,
            payload: getConnectDevice({ ...device, path }, getDeviceFeatures(features)),
        });
    return cy;
};

const onboardingShouldLoad = () => {
    return cy.get('html').should('contain', 'Welcome to Trezor');
};

Cypress.Commands.add('getTestElement', getTestElement);
Cypress.Commands.add('resetDb', { prevSubject: false }, resetDb);
Cypress.Commands.add('connectDevice', connectDevice);
Cypress.Commands.add('changeDevice', changeDevice);
Cypress.Commands.add('setState', setState);
Cypress.Commands.add('onboardingShouldLoad', onboardingShouldLoad);
