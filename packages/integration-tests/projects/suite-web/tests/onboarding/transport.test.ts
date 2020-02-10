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
        cy.getTestElement('@onboarding/button-begin')
            .click()
            .getTestElement('@onboarding/button-path-create')
            .click()
            .getTestElement('@onboarding/button-used-path')
            .click()
            .getTestElement('@onboarding/try-bridge-button')
            .click()
            .getTestElement('@onboarding/bridge');
    });

    it('user selects new device -> user selects model one -> in this case we know that he can not use webusb (unreadable device) so we disable webusb and offer bridge download', () => {
<<<<<<< e94e4f76e00c19f3239115ecd0c86b92665bfe1b
        cy.getTestElement('@onboarding/path-create-button')
=======
        cy.getTestElement('@onboarding/button-begin')
            .click()
            .getTestElement('@onboarding/button-path-create')
>>>>>>> fix disable webusb and tests
            .click()
            .getTestElement('@onboarding/path-new-button')
            .click()
            .getTestElement('@onboarding/option-model-one-path')
            .click()
            .getTestElement('@onboarding/bridge');
    })
});
