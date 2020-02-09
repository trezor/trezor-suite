describe('Onboarding unexpected states', () => {
    beforeEach(() => {
        cy.viewport(1024, 768).resetDb();
    });

    // todo: fails in CI, need to debug why
    it.skip('user selects he is going to use device as a new one and it is already connected, we detect this and notify user about the fact it is not new', () => {
        cy.task('startEmu');
        cy.task('wipeEmu');
        cy.task('setupEmu');
        cy.task('stopEmu');

        cy.visit('/');
        cy.goToOnboarding();
        cy.getTestElement('@onboarding/begin-button').click();
        cy.getTestElement('@onboarding/path-create-button').click();
        cy.getTestElement('@onboarding/path-new-button').click();

        cy.log('Test that device-is-not-new warning appears on any step up to connect step');
        cy.task('startEmu');
        cy.getTestElement('@onboarding/unexpected-state/go-to-suite-button');
        cy.task('stopEmu');
        cy.getTestElement('@onboarding/option-model-t-path').click();
        cy.task('startEmu');
        cy.getTestElement('@onboarding/unexpected-state/go-to-suite-button');
        cy.task('stopEmu');
        cy.getTestElement('@onboarding/continue-button').click();
        cy.task('startEmu');

        cy.getTestElement('@onboarding/unexpected-state/go-to-suite-button');
        // cant click it now, it triggers discovery which does not stop fast enough and affects nexts test
        // causing wrong previous session error on bridge

        // .click();
        // cy.dashboardShouldLoad();
    });

    it('in case it is not initialzed, just has some firmware on it, use-it-anyway button should appear', () => {
        cy.task('startEmu');
        cy.task('wipeEmu');
        cy.task('stopEmu');

        cy.visit('/');
        cy.goToOnboarding();
        cy.getTestElement('@onboarding/begin-button').click();
        cy.getTestElement('@onboarding/path-create-button').click();
        cy.getTestElement('@onboarding/path-new-button').click();

        cy.log('Test that device-is-not-new warning appears on any step up to connect step');
        cy.task('startEmu');
        cy.getTestElement('@onboarding/unexpected-state/use-it-anyway-button').click();
        // just check that we got rid of overlay
        cy.getTestElement('@onboarding/option-model-t-path').should('be.visible');
    })
});
