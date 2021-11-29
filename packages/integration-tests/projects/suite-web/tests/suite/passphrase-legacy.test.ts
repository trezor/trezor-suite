// @group:suite
// @retry=2

describe('Passphrase - legacy flow', () => {
    beforeEach(() => {
        cy.task('startEmu', { wipe: true, version: '2.2.0' });
        cy.task('setupEmu', { mnemonic: 'all all all all all all all all all all all all' });
        cy.task('startBridge');

        cy.viewport(1024, 768).resetDb();
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
        cy.getTestElement('@passphrase/confirm-checkbox').click();
        cy.getTestElement('@passphrase/input').type('b{enter}');
        cy.getTestElement('@dashboard/wallet-ready');
    });
});
