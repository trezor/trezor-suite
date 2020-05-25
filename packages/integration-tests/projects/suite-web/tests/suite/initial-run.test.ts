describe('Suite initial run', () => {
    beforeEach(() => {
        cy.viewport(1024, 768).resetDb();
        cy.task('stopEmu');
    });

    it('there is landing screen is before initial run (only for web)', () => {
        cy.visit('/');
        cy.getTestElement('@landing');
        cy.getTestElement('@landing/continue-in-browser-button').click();
        cy.getTestElement('@welcome');
        cy.passThroughInitialRun();
        cy.getTestElement('@modal/connect-device');
        cy.visit('/');
        cy.getTestElement('@landing/continue-in-browser-button').click();
        cy.getTestElement('@modal/connect-device');

    });

    it('When user opens suite for the first time at any route, welcome and analytics modals appear. Still reloads to welcome screen before initialRun flags is set to false', () => {
        cy.visit('/dashboard');
        cy.getTestElement('@welcome');
        cy.reload();
        cy.getTestElement('@welcome', { timeout: 20000 });
    });

    it('Once user passed trough, skips initial run and shows connect-device modal', () => {
        cy.visit('/dashboard');
        cy.passThroughInitialRun();
        cy.getTestElement('@modal/connect-device');
        cy.reload();
        cy.getTestElement('@modal/connect-device', { timeout: 20000 });
    });
});
