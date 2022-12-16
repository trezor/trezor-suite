// @group:onboarding
// @retry=2

describe('Onboarding - transport webusb/bridge', () => {
    beforeEach(() => {
        cy.viewport(1080, 1440).resetDb();
        cy.prefixedVisit('/');
    });

    it('Offer webusb as primary choice on web, but allow user to disable it and fallback to bridge', () => {
        cy.getTestElement('@webusb-button');
        cy.getTestElement('@connect-device-prompt/no-device-detected').click();
        cy.getTestElement('@onboarding/try-bridge-button').click();
        cy.getTestElement('@connect-device-prompt/bridge-not-running');
    });
});

export {};
