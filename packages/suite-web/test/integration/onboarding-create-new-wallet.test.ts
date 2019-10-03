/* eslint-disable @typescript-eslint/camelcase */
import { DEVICE } from 'trezor-connect';
import { getConnectDevice, getDeviceFeatures } from '../../../suite/src/support/tests/setupJest';

describe('Onboarding', () => {
    beforeEach(() => {
        cy.viewport(1024, 768).resetDb();
    });

    // todo: not finished yet, now I can control everything that happens in the app
    // through dispatching mocked actions, but I want to interact as close
    // to UI as possible, so I will need to mock trezor-connect that
    // is invoked on user clicks
    it(`create new wallet happy path`, () => {
        cy.visit('/')
            .get('html')
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
            .should('contain', 'Seed type');
            // todo: mock connect to make this work.
            // .getTestElement('button-standard-backup')
            // .click()
    });
});
