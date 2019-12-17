/* eslint-disable @typescript-eslint/no-namespace */
/* eslint-disable @typescript-eslint/no-var-requires */

import TrezorConnect, { Device, Features } from 'trezor-connect';
import { Store, AppState } from '@suite-types';

import { onboardingShouldLoad, walletShouldLoad } from './utils/assertions';
import { connectBootloaderDevice, connectDevice, changeDevice } from './utils/device';
import { getTestElement } from './utils/selectors';
import { resetDb, setState } from './utils/test-env';
import { toggleDeviceMenu } from './utils/shortcuts';

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
            connectBootloaderDevice: (path: string) => Chainable<any>;
            changeDevice: (
                path: string,
                device?: Partial<Device>,
                features?: Partial<Features>,
            ) => Chainable<any>;
            setState: (state: Partial<AppState>) => undefined;
            onboardingShouldLoad: () => Chainable<Subject>;
            walletShouldLoad: () => Chainable<Subject>;
            toggleDeviceMenu: () => Chainable<Subject>;
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

Cypress.Commands.add('resetDb', { prevSubject: false }, resetDb);
Cypress.Commands.add('setState', setState);
Cypress.Commands.add('connectDevice', connectDevice);
Cypress.Commands.add('connectBootloaderDevice', connectBootloaderDevice);
Cypress.Commands.add('changeDevice', changeDevice);
// assertion helpers
Cypress.Commands.add('onboardingShouldLoad', onboardingShouldLoad);
Cypress.Commands.add('walletShouldLoad', walletShouldLoad);
// selector helpers
Cypress.Commands.add('getTestElement', getTestElement);
// various shortcuts
Cypress.Commands.add('toggleDeviceMenu', toggleDeviceMenu);
