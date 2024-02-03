// @group:device-management
// @retry=2

describe('Onboarding - create wallet', () => {
    beforeEach(() => {
        cy.task('startBridge');
        cy.viewport(1080, 1440).resetDb();
        cy.prefixedVisit('/');
    });

    // todo: skipping for it is too flaky..
    // after calling "resetDevice" we almost always receive "device disconnected during action" which is error sent by bridge.
    it.skip('Success (basic)', () => {
        cy.task('startEmu', { version: '1-latest', wipe: true });
        cy.getTestElement('@analytics/continue-button').click();
        cy.getTestElement('@analytics/continue-button').click();
        cy.getTestElement('@firmware/continue-button').click();

        cy.getTestElement('@onboarding/path-create-button').click();
        cy.getTestElement('@onboarding/only-backup-option-button').click();
        cy.getTestElement('@onboarding/confirm-on-device').should('be.visible');
        cy.task('pressYes');

        cy.getTestElement('@onboarding/skip-backup');
        cy.log('It is possible to leave onboarding now');

        cy.getTestElement('@onboarding/create-backup-button').click();

        // todo: these are "after checkboxes". is that correct?
        cy.getTestElement('@backup/check-item/wrote-seed-properly').click();
        cy.getTestElement('@backup/check-item/made-no-digital-copy').click();
        cy.getTestElement('@backup/check-item/will-hide-seed').click();
        cy.getTestElement('@onboarding/confirm-on-device').should('not.be.visible');

        cy.getTestElement('@backup/start-button').click();
        cy.getTestElement('@onboarding/confirm-on-device').should('be.visible');
        cy.wait(501);

        for (let i = 0; i < 48; i++) {
            cy.task('pressYes');
            cy.wait(400);
        }

        cy.getTestElement('@backup/close-button').click();

        cy.log('Now we are in PIN step, skip button is available');
        cy.getTestElement('@onboarding/skip-button').should('be.visible');

        cy.log('Lets set PIN');
        cy.getTestElement('@onboarding/set-pin-button').click();
        cy.getTestElement('@onboarding/confirm-on-device').should('be.visible');

        cy.task('pressYes');

        cy.log('PIN mismatch for now will be enough');
        cy.getTestElement('@pin/input/1').click();
        cy.getTestElement('@pin/submit-button').click();
        cy.getTestElement('@pin/input/1').click();
        cy.getTestElement('@pin/input/1').click();
        cy.getTestElement('@pin/submit-button').click();
        cy.getTestElement('@pin-mismatch');
        cy.getTestElement('@pin-mismatch/try-again-button').click();

        cy.getTestElement('@onboarding/confirm-on-device').should('be.visible');
        cy.task('pressYes');

        cy.log('Pin matrix appears again');
        cy.getTestElement('@pin/input/1');
    });
});

export {};
