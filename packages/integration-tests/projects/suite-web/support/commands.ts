/* eslint-disable @typescript-eslint/no-namespace */
/* eslint-disable @typescript-eslint/no-var-requires */

import TrezorConnect, { Device, Features } from 'trezor-connect';
import { Store, AppState } from '@suite-types';

import { onboardingShouldLoad, dashboardShouldLoad } from './utils/assertions';
import { connectBootloaderDevice, connectDevice, changeDevice } from './utils/device';
import { getTestElement, getConfirmActionOnDeviceModal } from './utils/selectors';
import { resetDb, setState } from './utils/test-env';
import { toggleDeviceMenu, goToOnboarding, passThroughInitialRun, passThroughBackup, passThroughInitMetadata } from './utils/shortcuts';

const command = require('cypress-image-snapshot/command');

const prefixedVisit = (route: string, options?: Partial<Cypress.VisitOptions>) => {
    const assetPrefix = Cypress.env('ASSET_PREFIX') || '';
    return cy.visit(assetPrefix + route, options);
}
declare global {
    namespace Cypress {
        interface Chainable<Subject> {
            getTestElement: typeof getTestElement;
            prefixedVisit: typeof prefixedVisit;
            getConfirmActionOnDeviceModal: typeof getConfirmActionOnDeviceModal;
            resetDb: typeof resetDb;
            // todo: better types
            matchImageSnapshot: (options?: any) => Chainable<any>;
            connectDevice: (
                device?: Partial<Device>,
                features?: Partial<Features>,
            ) => Chainable<any>;
            connectBootloaderDevice: (path: string) => Chainable<any>;
            changeDevice: (
                path: string,
                device?: Partial<Device>,
                features?: Partial<Features>,
            ) => Chainable<any>;
            setState: (state: Partial<AppState>) => undefined;
            onboardingShouldLoad: () => Chainable<Subject>;
            dashboardShouldLoad: () => Chainable<Subject>;
            toggleDeviceMenu: () => Chainable<Subject>;
            passThroughInitialRun: () => Chainable<Subject>;
            passThroughBackup: () => Chainable<Subject>;
            passThroughInitMetadata: (provider: 'dropbox' | 'google') => Chainable<Subject>;
            goToOnboarding: () => Chainable<Subject>;
        }
    }
}

declare global {
    interface Window {
        store: Store;
        TrezorConnect: typeof TrezorConnect;
    }
}

if (Cypress.env('SNAPSHOT')) {
    command.addMatchImageSnapshotCommand({
        failureThreshold: 0.01, // threshold for entire image
        failureThresholdType: 'percent', // percent of image or number of pixels
    });
} else {
    Cypress.Commands.add('matchImageSnapshot', () => {
        return cy.log('skipping image snapshot')
    })
}

Cypress.Commands.add('prefixedVisit', prefixedVisit);
Cypress.Commands.add('resetDb', { prevSubject: false }, resetDb);
Cypress.Commands.add('setState', setState);
Cypress.Commands.add('connectDevice', connectDevice);
Cypress.Commands.add('connectBootloaderDevice', connectBootloaderDevice);
Cypress.Commands.add('changeDevice', changeDevice);
// assertion helpers
Cypress.Commands.add('onboardingShouldLoad', onboardingShouldLoad);
Cypress.Commands.add('dashboardShouldLoad', dashboardShouldLoad);
// selector helpers
Cypress.Commands.add('getTestElement', getTestElement);
Cypress.Commands.add('getConfirmActionOnDeviceModal', getConfirmActionOnDeviceModal);
// various shortcuts
Cypress.Commands.add('toggleDeviceMenu', toggleDeviceMenu);
Cypress.Commands.add('goToOnboarding', goToOnboarding);
Cypress.Commands.add('passThroughInitialRun', passThroughInitialRun);
Cypress.Commands.add('passThroughBackup', passThroughBackup);
Cypress.Commands.add('passThroughInitMetadata', passThroughInitMetadata);
