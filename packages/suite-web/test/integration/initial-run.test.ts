import { DEVICE } from 'trezor-connect';
import { getConnectDevice } from '../../../suite/src/support/tests/setupJest';

describe('Initial run', () => {
    beforeEach(() => {
        cy.resetDb().viewport(1024, 768);
    });

    it(`on first page load, user should be redirected to onboarding page, then he clicks 'use wallet now', reloads. Should not be redirected again`, () => {
        cy.visit('/')
            .get('html')
            .should('contain', 'Welcome to Trezor')
            .window()
            .its('store')
            .invoke('dispatch', { type: DEVICE.CONNECT, payload: getConnectDevice() })
            .getTestElement('button-use-wallet')
            .click()
            .get('html')
            .should('contain', 'Please select your coin')
            .reload()
            .get('html')
            .should('contain', 'Please select your coin');
    });
});
