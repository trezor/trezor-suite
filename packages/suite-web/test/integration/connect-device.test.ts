import { DEVICE } from 'trezor-connect';
import { getConnectDevice } from '../../../suite/src/support/tests/setupJest';

describe('Connect device', () => {
    beforeEach(() => {
        cy.viewport(1024, 768).resetDb();
    });

    it(`on first page load, user should be redirected to onboarding page, then he clicks 'use wallet now' and connects device`, () => {
        cy.visit('/')
            .get('html')
            .should('contain', 'Welcome to Trezor')
            .getTestElement('button-use-wallet')
            .click()
            .get('html')
            // todo: add snapshots in distance future when everything is stable
            // .matchImageSnapshot()
            .should('contain', 'Connect Trezor to continue')
            .window()
            .its('store')
            .invoke('dispatch', { type: DEVICE.CONNECT, payload: getConnectDevice() })
            .get('html')
            .should('contain', 'Please select your coin');
    });
});
