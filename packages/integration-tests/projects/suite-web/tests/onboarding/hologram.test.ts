// @group:onboarding
// @retry=2

describe('Onboarding - hologram', () => {
    beforeEach(() => {
        cy.task('stopEmu')
        cy.viewport(1024, 768).resetDb();
        cy.prefixedVisit('/');
        cy.goToOnboarding();
        cy.onboardingShouldLoad();
        // common steps - navigation through onboarding
        cy.getTestElement('@onboarding/begin-button').click();
        cy.getTestElement('@onboarding/path-recovery-button').click();
        cy.getTestElement('@onboarding/path-new-button').click();

    });

    it('Hologram, various cases', () => {
        cy.log('first check if correct video is displayed according to users choice of device');
        cy.getTestElement('@onboarding/option-model-one-path').click();
        cy.getTestElement('@onboarding/hologram/model-1-video');
        cy.getTestElement('@onboarding/back-button').click();
        cy.getTestElement('@onboarding/option-model-t-path').click();
        cy.getTestElement('@onboarding/hologram/model-2-video');

        cy.log('hmm... it looks different, maybe?');
        cy.getTestElement('@onboarding/hologram/hologram-different-button').click();
        cy.getTestElement('@onboarding/hologram/show-hologram-again-button').click();
        cy.log('nah, it is fine actually, lets proceed');
        cy.getTestElement('@onboarding/hologram/continue-button').click();
    });
});
