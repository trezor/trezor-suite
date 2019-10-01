/* eslint-disable @typescript-eslint/camelcase */
import { DEVICE } from 'trezor-connect';
import { getConnectDevice, getDeviceFeatures } from '../../../suite/src/support/tests/setupJest';

describe('Connect device', () => {
    beforeEach(() => {
        cy.viewport(1024, 768).resetDb();
    });

    it(`on first page load, user should be redirected to onboarding page, then he clicks 'use wallet now' and connects device`, () => {
        cy.dispatchDeviceConnect().then(dispatch => {
            cy.visit('/')
                .get('html')
                .should('contain', 'Welcome to Trezor')
                .window()
                .its('store')
                .invoke('dispatch', dispatch)
                .getTestElement('button-use-wallet')
                .click()
                // todo: add snapshots in distance future when everything is stable
                // .matchImageSnapshot()
                .get('html')
                .should('contain', 'Please select your coin');
        });
    });

    it(`onboarding shit`, () => {
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
    });
});
