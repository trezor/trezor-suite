describe('Suite initial run', () => {
    beforeEach(() => {
        cy.viewport(1024, 768).resetDb();
        cy.task('stopEmu');
    });

    it('There is always landing screen is before initial run (only for web). It is not saved into db atm', () => {
        cy.prefixedVisit('/');
        cy.passThroughInitialRun();
        cy.getTestElement('@modal/connect-device');
        cy.prefixedVisit('/');
        cy.getTestElement('@landing/continue-in-browser-button').click();
        cy.getTestElement('@modal/connect-device');
    });

    it('Until user passed through initial run, it will be there after reload', () => {
        cy.prefixedVisit('/');
        cy.getTestElement('@landing/continue-in-browser-button').click()
        cy.getTestElement('@welcome/continue-button').click()
        cy.reload();
        cy.getTestElement('@landing/continue-in-browser-button').click()
        cy.getTestElement('@welcome/continue-button').click()
    });

    it('Once user passed trough, skips initial run and shows connect-device modal', () => {
        cy.prefixedVisit('/');
        cy.getTestElement('@landing/continue-in-browser-button').click()
        cy.getTestElement('@welcome/continue-button').click()
        cy.getTestElement('@analytics/go-to-onboarding-button').click()
        cy.getTestElement('@onboarding/skip-button').click()
        cy.getTestElement('@onboarding/skip-button').click()
        cy.getTestElement('@suite/loading').should('not.exist');
        cy.reload();
        cy.getTestElement('@landing/continue-in-browser-button').click()
        cy.getTestElement('@modal/connect-device');

    });
});
