// @group:suite
// @retry=2

describe.skip('prerequisites = test various types of devices connecting to the application', () => {
    before(() => {
        cy.viewport(1080, 1440);
    });
    beforeEach(() => {
        // cy.prefixedVisit('/');
        cy.getTestElement('@connect-device-prompt');
    });

    it('device-seedless', () => {
        cy.connectDevice({ mode: 'seedless' });
        cy.getTestElement('@onboarding/expand-troubleshooting-tips').click();
        cy.getTestElement('@collapsible-box/body').should('have.css', 'opacity', '1');
        cy.getTestElement('@welcome-layout/body').screenshot('device-seedless');
    });

    it('device-unacquired', () => {
        cy.connectDevice({ mode: 'unacquired' });
        cy.getTestElement('@onboarding/expand-troubleshooting-tips').click();
        cy.getTestElement('@collapsible-box/body').should('have.css', 'opacity', '1');
        cy.getTestElement('@welcome-layout/body').screenshot('device-unacquired');
    });

    it('device-unreadable', () => {
        cy.connectDevice({ mode: 'unreadable' });
        cy.getTestElement('@onboarding/expand-troubleshooting-tips').click();
        cy.getTestElement('@collapsible-box/body').should('have.css', 'opacity', '1');
        cy.getTestElement('@welcome-layout/body').screenshot('device-unreadable');
    });

    it('device-unknown', () => {
        cy.connectDevice({ features: undefined });
        cy.getTestElement('@onboarding/expand-troubleshooting-tips').click();
        cy.getTestElement('@collapsible-box/body').should('have.css', 'opacity', '1');
        cy.getTestElement('@welcome-layout/body').screenshot('device-unknown');
    });

    it('device-disconnected', () => {
        cy.getTestElement('@onboarding/expand-troubleshooting-tips').click();
        cy.getTestElement('@collapsible-box/body').should('have.css', 'opacity', '1');
        cy.getTestElement('@welcome-layout/body').screenshot('device-disconnected');
    });

    it('device-bootloader', () => {
        cy.connectBootloaderDevice('1');

        // click is not required, tips are expanded automatically

        cy.getTestElement('@collapsible-box/body').should('have.css', 'opacity', '1');
        cy.getTestElement('@welcome-layout/body').screenshot('device-bootloader');
    });

    describe('should redirect to onboarding', () => {
        it('to welcome step', () => {
            cy.connectDevice({ mode: 'initialize' });
            cy.getTestElement('@onboarding/welcome');
        });

        // device-recover-mode is tested elsewhere with full-fledged emulator
    });
});
