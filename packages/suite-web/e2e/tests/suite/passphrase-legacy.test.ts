// @group:passphrase
// @retry=2

// todo: this test is skipped because it does not work and it can't be debugged on MacArm
// and currently there is nobody who would be able to debug it on a different platform
// also 2.2.0 is very old and we might consider deprecating it soon
describe.skip('Passphrase - legacy flow', () => {
    beforeEach(() => {
        cy.task('startEmu', { wipe: true, version: '2.2.0' });
        cy.task('setupEmu', { mnemonic: 'all all all all all all all all all all all all' });
        cy.task('startBridge');

        cy.viewport(1440, 2560).resetDb();
        cy.prefixedVisit('/');
        cy.passThroughInitialRun();
    });

    it('2.2.0 asks whether user wants to input on host or device first', () => {
        cy.getTestElement('@menu/switch-device').click();
        cy.getTestElement('@switch-device/add-hidden-wallet-button').click();

        // passphrase feature is turned on first
        cy.getTestElement('@suite/modal/confirm-action-on-device');
        cy.task('pressYes');

        // entry on device
        cy.getTestElement('@modal/passphrase-source');
        cy.task('clickEmu', { x: 120, y: 120 });
        cy.getTestElement('@modal/enter-passphrase-on-device');
        cy.task('inputEmu', 'a');
        // this passphrase is not empty -> no prompt for another passphrase entry
        cy.getTestElement('@dashboard/graph');

        // entry on host
        cy.getTestElement('@menu/switch-device').click();
        cy.getTestElement('@switch-device/add-hidden-wallet-button').click();
        cy.getTestElement('@modal/passphrase-source');
        cy.task('clickEmu', { x: 120, y: 180 });
        cy.getTestElement('@passphrase/input').type('b{enter}');
        // this passphrase is empty -> has a prompt for another passphrase entry
        cy.getTestElement('@modal/confirm-empty-hidden-wallet');
        cy.task('clickEmu', { x: 120, y: 180 });
        cy.getTestElement('@passphrase/confirm-checkbox', { timeout: 20000 }).click();
        cy.getTestElement('@passphrase/input').type('b{enter}');
        cy.getTestElement('@dashboard/wallet-ready');

        // documenting a bug with wrong walletNumber. It is not correctly assigned for the first
        // hidden wallet created. I am not fixing this since 2.2.0 will soon be marked with required update
        cy.screenshot();
        cy.getTestElement('@menu/switch-device').click();

        // try to get address. passhprase should not be prompted
        cy.getTestElement('@switch-device/wallet-on-index/2').click();
        cy.getTestElement('@dashboard/receive-button').click();
        cy.getTestElement('@wallet/receive/reveal-address-button').click();
        cy.getTestElement('@modal/confirm-address/address-field');
    });
});

export {};
