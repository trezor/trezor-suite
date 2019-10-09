/* eslint-disable @typescript-eslint/camelcase */
import { DEVICE } from 'trezor-connect';

// todo: importing like this works now.
// import * as connectActions from '@onboarding-actions/connectActions';

// declaration for support files is not present in babel.config (and probably shouldnt be)
import { getConnectDevice, getDeviceFeatures } from '../../../suite/src/support/tests/setupJest';

describe('Onboarding happy paths', () => {
    beforeEach(() => {
        cy.viewport(1024, 768).resetDb();
    });

    it(`create new wallet - skip security - appear in wallet`, () => {
        cy.visit('/');
        cy.window()
            .its('TrezorConnect')
            .should('exist')
            .then(TrezorConnect => {
                cy.stub(TrezorConnect, 'resetDevice', () => {
                    console.warn('sthubbed shit');
                    return Promise.resolve({ success: true });
                });
                cy.get('html')
                    .should('contain', 'Welcome to Trezor')
                    .getTestElement('button-path-create')
                    .click()
                    // todo: add snapshots in distance future when everything is stable
                    // .matchImageSnapshot()
                    .get('html')
                    .should('contain', 'New device')
                    .getTestElement('button-new-path')
                    .click()
                    .get('html')
                    .should('contain', 'Select your device')
                    .getTestElement('option-model-t-path')
                    .click()
                    .get('html')
                    .should('contain', 'Hologram check')
                    .getTestElement('button-continue')
                    .click()
                    .get('html')
                    .should('contain', 'Pair device')
                    .window()
                    .its('store')
                    .invoke('dispatch', {
                        type: DEVICE.CONNECT,
                        payload: getConnectDevice({
                            mode: 'initialize',
                            firmware: 'none',
                            features: getDeviceFeatures({
                                firmware_present: false,
                                bootloader_mode: true,
                                initialized: false,
                            }),
                        }),
                    })
                    .getTestElement('button-continue')
                    .click()
                    .get('html')
                    .should('contain', 'Pair device')
                    .window()
                    .its('store')
                    .invoke('dispatch', {
                        type: DEVICE.CHANGED,
                        payload: getConnectDevice({
                            mode: 'initialize',
                            firmware: 'valid',
                            features: getDeviceFeatures({
                                firmware_present: true,
                                bootloader_mode: false,
                                initialized: false,
                            }),
                        }),
                    })
                    .getTestElement('button-continue')
                    .click()
                    .get('html')
                    .should('contain', 'Seed type')
                    .getTestElement('button-standard-backup')
                    .click()
                    .get('html')
                    .should('contain', 'Take me to security')
                    .getTestElement('button-exit-app')
                    .click();
            });
    });
});
