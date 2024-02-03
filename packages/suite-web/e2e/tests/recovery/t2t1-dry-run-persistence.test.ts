// @group:device-management
// @retry=2

describe('Recovery - dry run', () => {
    beforeEach(() => {
        cy.task('startEmu', { wipe: true });
        cy.task('setupEmu', {
            mnemonic: 'all all all all all all all all all all all all',
        });
        cy.task('startBridge');
        cy.viewport(1080, 1440).resetDb();
    });

    // Test case skipped because it was unstable
    // See the issue for more details - https://github.com/trezor/trezor-suite/issues/4128
    it.skip('Communication between device and application is automatically established whenever app detects device in recovery mode', () => {
        cy.prefixedVisit('/');
        cy.passThroughInitialRun();
        cy.getTestElement('@suite/menu/settings').click();
        cy.getTestElement('@settings/menu/device').click();

        cy.getTestElement('@settings/device/check-seed-button').click();
        cy.getTestElement('@recovery/user-understands-checkbox').click();
        cy.getTestElement('@recovery/start-button').click();
        cy.task('pressYes');
        cy.getTestElement('@suite/modal/confirm-action-on-device');

        /* reinitialize process on device reconnect */
        cy.log(
            'Now check that reconnecting device works and seed check procedure does reinitialize correctly',
        );
        cy.wait(501);
        cy.task('stopEmu');
        cy.getTestElement('@recovery/close-button', { timeout: 30000 }).click();
        cy.getTestElement('@connect-device-prompt');
        cy.task('startEmu', { wipe: false });
        cy.getTestElement('@suite/modal/confirm-action-on-device', { timeout: 20000 });
        cy.task('pressYes');
        cy.log('At this moment, communication with device should be re-established');

        /* reinitialize process on app reload */

        cy.log(
            'On app reload, recovery process should auto start if app detects initialized device in recovery mode',
        );

        cy.safeReload().task('stopBridge').task('startBridge');
        cy.wait(2000);

        cy.getTestElement('@suite/modal/confirm-action-on-device');
        cy.task('pressYes');
        cy.task('selectNumOfWordsEmu', 12);
        cy.task('pressYes');
        cy.log('Communication established, now finish the seed check process');

        for (let i = 0; i < 12; i++) {
            cy.task('inputEmu', 'all');
        }
        cy.task('pressYes');

        cy.getTestElement('@recovery/success-title');
    });
});

export {};
