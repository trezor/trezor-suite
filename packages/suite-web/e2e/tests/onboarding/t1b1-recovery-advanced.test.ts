// @group:bounty
// @retry=2

describe('Onboarding - recover wallet T1B1', () => {
    beforeEach(() => {
        cy.task('startEmu', { version: '1-latest', wipe: true });
        cy.task('startBridge');

        cy.viewport(1440, 2560).resetDb();
        cy.prefixedVisit('/');
    });

    it('Incomplete run of advanced recovery', () => {
        cy.getTestElement('@analytics/continue-button').click();
        cy.getTestElement('@analytics/continue-button').click();
        cy.getTestElement('@firmware/continue-button').click();
        cy.getTestElement('@onboarding/path-recovery-button').click();

        // cy.getTestElement('@onboarding/button-continue').click();
        // cy.getTestElement('@firmware/continue-button').click();
        cy.getTestElement('@recover/select-count/24').click();
        cy.getTestElement('@recover/select-type/advanced').click();
        cy.getTestElement('@onboarding/confirm-on-device').should('be.visible');
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
        cy.task('startEmu', { version: '1-latest' });

        cy.getTestElement('@onboarding/recovery/retry-button').click();
        cy.getTestElement('@recover/select-count/12').click();
        cy.getTestElement('@recover/select-type/basic').click();

        cy.getTestElement('@onboarding/confirm-on-device').should('be.visible');
        cy.task('pressYes');
        cy.getTestElement('@word-input-select/input');

        // todo: finish reading from device. needs support in trezor-user-env
    });
});

export {};
