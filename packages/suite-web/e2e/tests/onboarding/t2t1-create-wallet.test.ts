// @group:onboarding
// @retry=2

describe('Onboarding - create wallet', () => {
    beforeEach(() => {
        cy.task('startBridge');
        cy.viewport(1080, 1440).resetDb();
        cy.prefixedVisit('/');
    });

    it('Success (Shamir backup)', () => {
        // note: this is an example of test that can not be parametrized to be both integration (isolated) test and e2e test.
        // the problem is that it always needs to run the newest possible emulator. If this was pinned to use emulator which is currently
        // in production, and we locally bumped emulator version, we would get into a screen saying "update your firmware" and the test would fail.
        cy.task('startEmu', { wipe: true, version: '2-master' });
        cy.getTestElement('@analytics/continue-button').click();
        cy.getTestElement('@analytics/continue-button').click();
        cy.getTestElement('@firmware/continue-button').click();
        cy.getTestElement('@onboarding/path-create-button').click();

        cy.log('Will be clicking on Shamir backup button');
        cy.getTestElement('@onboarding/shamir-backup-option-button').click();
        cy.getTestElement('@onboarding/confirm-on-device').should('be.visible');
        cy.task('pressYes');

        cy.getTestElement('@onboarding/create-backup-button').click();

        const shares = 3;
        const threshold = 2;
        cy.passThroughBackupShamir(shares, threshold);
        cy.getTestElement('@onboarding/set-pin-button').click();
        cy.getTestElement('@onboarding/confirm-on-device');

        cy.task('pressYes');
        cy.task('inputEmu', '12');
        cy.task('inputEmu', '12');
        cy.getTestElement('@prompts/confirm-on-device');
        cy.task('pressYes');
        cy.getTestElement('@onboarding/pin/continue-button');
    });
});

export {};
