describe('Suite initial run: when user opens suite for the first time, welcome and analytics modals appear', () => {
    beforeEach(() => {
        cy.viewport(1024, 768).resetDb();
    });

    it('Still reloads to welcome screen before initialRun flags is set to false', () => {
        cy.visit('/');
        cy.getTestElement('@welcome');
        cy.reload();
        cy.getTestElement('@welcome');
    });

    it('Skips initial run and shows connect-device modal', () => {
        cy.visit('/');
        cy.passThroughInitialRun();
        cy.getTestElement('@modal/connect-device');
        cy.reload();
        cy.getTestElement('@modal/connect-device');
    });
});
