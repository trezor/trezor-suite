// @group:onboarding
// @retry=2

describe('Onboarding - packaging security', () => {
    beforeEach(() => {
        cy.task('startBridge');
        cy.viewport(1024, 768).resetDb();
        cy.prefixedVisit('/');
    });

    it('Device without firmware is expected to come fresh out of package', () => {
        cy.connectDevice({ mode: 'initialize', firmware: 'none' });
        cy.getTestElement('@onboarding/continue-button').click();
        cy.getTestElement('@onboarding/exit-app-button');
        cy.matchImageSnapshot('security-check');
    });
});
