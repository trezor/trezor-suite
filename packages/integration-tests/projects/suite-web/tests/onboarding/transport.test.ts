// @group:onboarding
// @retry=2

describe('Onboarding - transport webusb/bridge', () => {
    beforeEach(() => {
        cy.task('stopEmu');
        cy.task('stopBridge');
        cy.viewport(1024, 768).resetDb();
        cy.prefixedVisit('/');
        cy.goToOnboarding()
        cy.onboardingShouldLoad();
    });

    after(() => {
        // default state of tests framework is bridge running.
        cy.task('startBridge');
    })

    it('Offer webusb as primary choice on web, but allow user to disable it and fallback to bridge', () => {
        cy.getTestElement('@onboarding/begin-button').click();
        cy.getTestElement('@onboarding/path-create-button').click();
        cy.getTestElement('@onboarding/path-used-button').click();
        cy.getTestElement('@onboarding/try-bridge-button').click();
        cy.getTestElement('@onboarding/bridge');
    });

    it('User selects new device -> user selects model one -> in this case we know that he can not use webusb (unreadable device) so we disable webusb and offer bridge download', () => {
        cy.getTestElement('@onboarding/begin-button').click();
        cy.getTestElement('@onboarding/path-create-button').click();
        cy.getTestElement('@onboarding/path-new-button').click();
        cy.getTestElement('@onboarding/option-model-one-path').click();
        cy.getTestElement('@onboarding/hologram/continue-button').click();
        cy.log('see, no try bridge button, we already know we can not use webusb');
        cy.getTestElement('@onboarding/bridge');
        cy.task('startBridge');
        cy.log('in the meanwhile, user installed bridge. suite detects it.');
        cy.getTestElement('@onboarding/pair-device-step');
    });
});
