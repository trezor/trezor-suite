// @group:onboarding
// @retry=2

describe('Onboarding - recover wallet T2T1', () => {
    beforeEach(() => {
        cy.task('startBridge');
        cy.viewport(1080, 1440).resetDb();
        cy.prefixedVisit('/');
        // note: this is an example of test that can not be parametrized to be both integration (isolated) test and e2e test.
        // the problem is that it always needs to run the newest possible emulator. If this was pinned to use emulator which is currently
        // in production, and we locally bumped emulator version, we would get into a screen saying "update your firmware" and the test would fail.
        cy.task('startEmu', { wipe: true, version: '2-master' });

        cy.getTestElement('@analytics/continue-button').click();
        cy.getTestElement('@analytics/continue-button').click();

        cy.getTestElement('@firmware/continue-button').click();

        cy.getTestElement('@onboarding/path-recovery-button').click();
    });

    it('Device disconnected during action', () => {
        cy.getTestElement('@onboarding/confirm-on-device');
        cy.task('pressYes');
        cy.wait(501);
        cy.task('stopEmu');
        cy.getTestElement('@connect-device-prompt', { timeout: 20000 });
        cy.task('startEmu', { wipe: false });
        cy.log(
            'If device disconnected during call, error page with retry button should appear. Also note, that unlike with T1B1, retry button initiates recoveryDevice call immediately',
        );
        cy.getTestElement('@onboarding/recovery/start-button', { timeout: 10000 }).click();
        cy.getTestElement('@onboarding/confirm-on-device');
    });
});

export {};
