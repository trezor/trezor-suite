/* eslint-disable @typescript-eslint/naming-convention */

// @group:onboarding
// @retry=2

describe('Onboarding - recover wallet T1', () => {
    beforeEach(() => {
        cy.task('startEmu', { version: Cypress.env('emuVersionT1'), wipe: true });
        cy.task('startBridge');

        cy.viewport(1024, 768).resetDb();
        cy.prefixedVisit('/');
    });

    it('Incomplete run of advanced recovery', () => {
        cy.getTestElement('@onboarding/continue-button').click();
        cy.getTestElement('@onboarding/continue-button').click();
        cy.getTestElement('@firmware/continue-button').click();
        cy.getTestElement('@onboarding/path-recovery-button').click();

        // cy.getTestElement('@onboarding/button-continue').click();
        // cy.getTestElement('@firmware/continue-button').click();
        cy.getTestElement('@recover/select-count/24').click();
        cy.getTestElement('@recover/select-type/advanced').click();
        cy.task('pressYes');

        cy.log('typical user starts doing the T9 craziness');
        for (let i = 0; i <= 4; i++) {
            cy.getTestElement('@recovery/word-input-advanced/1').click({ force: true });
        }
        cy.log(
            'but after a while he finds he has no chance to finish it ever, so he disconnects device as there is no cancel button',
        );
        cy.wait(501);
        cy.task('stopEmu');
        cy.getTestElement('@connect-device-prompt', { timeout: 20000 });
        cy.task('startEmu', { version: Cypress.env('emuVersionT1') });

        cy.getTestElement('@onboarding/recovery/retry-button').click();
        cy.getTestElement('@recover/select-count/12').click();
        cy.getTestElement('@recover/select-type/basic').click();

        cy.task('pressYes');
        cy.getTestElement('@word-input-select/input');

        // todo: finish reading from device. needs support in trezor-user-env
    });
});
