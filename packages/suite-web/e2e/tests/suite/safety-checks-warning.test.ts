// @group:suite
// @retry=2

// TODO: enable this test once https://github.com/trezor/trezor-user-env/issues/54
// is resolved
// describe('safety_checks Warning For PromptAlways', () => {
//     beforeEach(() => {
//         cy.task('startEmu', {  wipe: true });
//         cy.task('setupEmu');
//         cy.task('startBridge');
//         cy.viewport(1440, 2560).resetDb();
//         cy.prefixedVisit('/settings/device/');
//         cy.passThroughInitialRun();
//         // TODO: set safety_checks to `PromptAlways`
//     });

//     it('Non-dismissible warning appears', () => {
//         cy.getTestElement('@banner/safety-checks/button');
//         cy.getTestElement('@banner/safety-checks/dismiss').should('not.exist');
//     });
// })

describe('safety_checks Warning For PromptTemporarily', () => {
    beforeEach(() => {
        cy.task('startEmu', { wipe: true });
        cy.task('setupEmu');
        cy.task('startBridge');
        cy.viewport(1440, 2560).resetDb();
        // Start in the device settings to easily open safety_checks setting modal.
        cy.prefixedVisit('/');
        cy.passThroughInitialRun();
        cy.discoveryShouldFinish();
        cy.getTestElement('@suite/menu/settings').click();
        cy.getTestElement('@settings/menu/device').click();

        // Set safety_checks to `PromptTemporarily'.
        // TODO: do this via the `applySetting` task once https://github.com/trezor/trezor-user-env/issues/54
        // is resolved.
        cy.getTestElement('@settings/device/safety-checks-button').click({
            scrollBehavior: 'bottom',
        });
        cy.get(`[data-test-id="@radio-button-prompt"]`).click();
        cy.getTestElement('@safety-checks-apply').click();
        cy.getTestElement('@prompts/confirm-on-device');
        cy.task('pressYes');
    });

    it('Dismissible warning appears', () => {
        cy.getTestElement('@banner/safety-checks/button');
        cy.getTestElement('@banner/safety-checks/dismiss');
    });

    it('CTA button opens device settings', () => {
        cy.getTestElement('@banner/safety-checks/button').click();
        // In CI the path is prefixed with a branch name. Test only against the end of the path.
        cy.location('pathname').should('match', /\/settings\/device$/);
    });

    it('Dismiss button hides the warning', () => {
        cy.getTestElement('@banner/safety-checks/dismiss').click();
        cy.getTestElement('@banner/safety-checks/button').should('not.exist');
    });

    it('Warning disappears when safety_checks are set to strict', () => {
        // Open the safety_checks setting modal and change safety_checks to Strict.
        cy.getTestElement('@settings/device/safety-checks-button').click({
            scrollBehavior: 'bottom',
        });
        cy.get('[data-test-id="@radio-button-strict"]').click();
        cy.getTestElement('@safety-checks-apply').click();
        cy.getTestElement('@prompts/confirm-on-device');
        cy.task('pressYes');
        // Assert the warning is gone.
        cy.getTestElement('@banner/safety-checks/button').should('not.exist');
    });

    it('Dismissed warning re-appears when safety_checks are set to strict and then to Prompt again.', () => {
        // Dismiss the warning.
        cy.getTestElement('@banner/safety-checks/dismiss').click();
        // Open the safety_checks setting modal and change safety_checks to Strict.
        cy.getTestElement('@settings/device/safety-checks-button').click({
            scrollBehavior: 'bottom',
        });
        cy.get('[data-test-id="@radio-button-strict"]').click();
        cy.getTestElement('@safety-checks-apply').click();
        cy.getTestElement('@prompts/confirm-on-device');
        cy.task('pressYes');
        // Assert the warning is gone.
        cy.getTestElement('@banner/safety-checks/button').should('not.exist');
        // Set safety_checks back to PromptTemporarily
        cy.getTestElement('@settings/device/safety-checks-button').click({
            scrollBehavior: 'bottom',
        });
        cy.get(`[data-test-id="@radio-button-prompt"]`).click();
        cy.getTestElement('@safety-checks-apply').click();
        cy.getTestElement('@prompts/confirm-on-device');
        cy.task('pressYes');
        // Assert the warning appear again.
        cy.getTestElement('@banner/safety-checks/button');
    });
});

export {};
