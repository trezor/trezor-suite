/* eslint-disable @typescript-eslint/camelcase */
import { TRANSPORT } from 'trezor-connect';

describe('Transport webusb/bridge', () => {
    beforeEach(() => {
        cy.task('stopBridge').task('stopEmu');
        cy.viewport(1024, 768).resetDb();
        cy.visit('')
            .goToOnboarding()
            .onboardingShouldLoad();
    });

    it('Offer webusb as primary choice on web, but allow user to disable it and fallback to bridge', () => {
        cy.getTestElement('@onboarding/begin-button').click();
        cy.getTestElement('@onboarding/path-create-button').click();
        cy.getTestElement('@onboarding/path-used-button').click();
        cy.getTestElement('@onboarding/try-bridge-button').click();
        cy.getTestElement('@onboarding/bridge');
    });

    it('user selects new device -> user selects model one -> in this case we know that he can not use webusb (unreadable device) so we disable webusb and offer bridge download', () => {
        cy.getTestElement('@onboarding/begin-button').click();
        cy.getTestElement('@onboarding/path-create-button').click();
        cy.getTestElement('@onboarding/path-new-button').click();
        cy.getTestElement('@onboarding/option-model-one-path').click();
        cy.getTestElement('@onboarding/continue-button').click();
        // see, no try bridge button, we already know we can not use webusb
        cy.getTestElement('@onboarding/bridge');
    });
});
