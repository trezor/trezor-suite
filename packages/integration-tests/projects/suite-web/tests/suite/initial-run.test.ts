// @group:suite
// @retry=2

describe('Suite initial run', () => {
    beforeEach(() => {
        cy.viewport(1024, 768).resetDb();
        cy.task('startEmu', { wipe: true });
        cy.task('setupEmu');
        cy.task('startBridge');
    });

    it('Until user passed through initial run, it will be there after reload', () => {
        cy.prefixedVisit('/');
        cy.getTestElement('@onboarding/continue-button').click()
        cy.reload();
        cy.getTestElement('@onboarding/continue-button').click()
    });

    it('Once user passed trough, skips initial run and shows connect-device modal', () => {
        cy.prefixedVisit('/');
        cy.getTestElement('@onboarding/continue-button').click()
        cy.getTestElement('@onboarding/exit-app-button').click()
        cy.discoveryShouldFinish();
        cy.reload();
        cy.discoveryShouldFinish();
    });
});
