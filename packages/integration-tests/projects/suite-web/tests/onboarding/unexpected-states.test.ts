// @group:onboarding
// @retry=2

describe('Onboarding - unexpected states', () => {
    beforeEach(() => {
        cy.task('stopEmu');
        cy.viewport(1024, 768).resetDb();
    });

    it('user selects he is going to use device as a new one and it is already connected, we detect this and notify user about the fact it is not new', () => {
        cy.task('startEmu', { wipe: true });
        cy.task('setupEmu');
        cy.task('stopEmu');

        cy.prefixedVisit('/');
        cy.goToOnboarding();
        cy.getTestElement('@onboarding/begin-button').click();
        cy.getTestElement('@onboarding/path-create-button').click();
        cy.getTestElement('@onboarding/path-new-button').click();

        cy.log('Test that device-is-not-new warning appears on any step up to connect step');
        cy.task('startEmu', { wipe: false });
        cy.getTestElement('@onboarding/unexpected-state/go-to-suite-button');
    });

    it('in case device is not initialized, just has some firmware on it, use-it-anyway button should appear', () => {
        cy.prefixedVisit('/');
        cy.goToOnboarding();
        cy.getTestElement('@onboarding/begin-button').click();
        cy.getTestElement('@onboarding/path-create-button').click();
        cy.getTestElement('@onboarding/path-new-button').click();

        cy.log('Test that device-is-not-new warning appears on any step up to connect step');
        cy.task('startEmu', { wipe: true });
        cy.getTestElement('@onboarding/unexpected-state/use-it-anyway-button').click();

        cy.getTestElement('@onboarding/option-model-t-path').should('be.visible');
    });

    it('is not same device and reset onboarding', () => {
        cy.prefixedVisit('/');
        cy.goToOnboarding();
        cy.getTestElement('@onboarding/begin-button').click();
        cy.getTestElement('@onboarding/path-create-button').click();
        cy.getTestElement('@onboarding/path-used-button').click();
        cy.task('startEmu', { wipe:  true });
        cy.getTestElement('@onboarding/button-continue').click();
        cy.getTestElement('@firmware/skip-button').click();
        cy.getTestElement('@onboarding/button-standard-backup').click();
        cy.task('pressYes');
        cy.getTestElement('@onboarding/continue-to-security-button').click();
        cy.task('stopEmu');
        cy.getTestElement('@onboarding/unexpected-state/reconnect');
        cy.connectDevice();
        cy.getTestElement('@onboarding/unexpected-state/is-same/start-over-button').click();
        cy.getTestElement('@onboarding/begin-button').click();
        cy.getTestElement('@onboarding/path-create-button');
    })
});
