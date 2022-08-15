// @group:onboarding
// @retry=2

describe('Onboarding - transport webusb/bridge', () => {
    beforeEach(() => {
        cy.viewport(1080, 1440).resetDb();
        cy.prefixedVisit('/');
    });

    it('Offer webusb as primary choice on web, but allow user to disable it and fallback to bridge', () => {
        // the type was not immediately "WebUsbPlugin", causing a rerender
        cy.window()
            .its('store')
            .invoke('getState')
            .should(state => {
                expect(state?.suite.transport?.type).to.deep.eq('WebUsbPlugin');
            });

        cy.getTestElement('@onboarding/expand-troubleshooting-tips').click();

        cy.getTestElement('@onboarding/try-bridge-button').click();
        // todo: bridge page should be available (not implemented yet)
    });
});
