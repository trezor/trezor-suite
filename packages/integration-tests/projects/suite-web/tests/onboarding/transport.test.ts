// @group:onboarding
// @retry=2

describe('Onboarding - transport webusb/bridge', () => {
    beforeEach(() => {
        cy.viewport(1024, 768).resetDb();
        cy.prefixedVisit('/');
    });

    it('Offer webusb as primary choice on web, but allow user to disable it and fallback to bridge', () => {
        cy.getTestElement('@onboarding/expand-troubleshooting-tips').click();
        cy.getTestElement('@onboarding/try-bridge-button').click();
        // todo: bridge page should be available (not implemented yet)
    });
});
