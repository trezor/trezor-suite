// @group:onboarding
// @retry=2

describe('Onboarding - packaging security', () => {
    beforeEach(() => {
        cy.task('startBridge');
        cy.viewport(1080, 1440).resetDb();
        cy.prefixedVisit('/');
    });

    it('Device without firmware is expected to come fresh out of package', () => {
        cy.connectDevice({ mode: 'initialize', firmware: 'none' });
        cy.getTestElement('@onboarding/continue-button').click();
        cy.getTestElement('@onboarding/exit-app-button').should('be.visible');
        cy.getTestElement('@onboarding/box-animated').should('have.css', 'opacity', '1');
        cy.getTestElement('@welcome-layout/body').matchImageSnapshot('security-check');
    });
});
