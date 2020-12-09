// @group:settings
// @retry=2

describe('General settings', () => {
    beforeEach(() => {
        cy.task('startEmu', { wipe: true });
        cy.task('setupEmu', { needs_backup: false });
        cy.task('startBridge');
        cy.viewport(1024, 768).resetDb();
        cy.prefixedVisit('/settings');
        cy.passThroughInitialRun();
    });

    it('Change fiat', () => {
        cy.getTestElement('@settings/fiat-select/input').click();
        cy.getTestElement('@settings/fiat-select/option/eur').click();
        cy.getTestElement('@suite/menu/suite-index').click();
        cy.getTestElement('@dashboard/index').should('contain', '€0.00')

    });
});
