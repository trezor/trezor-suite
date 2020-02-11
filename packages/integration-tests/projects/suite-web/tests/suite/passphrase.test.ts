describe('Passphrase', () => {
    beforeEach(() => {
        cy.task('startEmu');
        cy.task('wipeEmu');
        cy.task('setupEmu');
        cy.task('setPasshpraseSourceEmu', 'host');
        cy.viewport(1024, 768).resetDb();
    });

    it('bla', () => {
        cy.visit('/');
        cy.passThroughInitialRun();
        cy.getTestElement('@menu/switch-device').click();
        cy.getTestElement('@switch-device/add-hidden-wallet-button').click();

        cy.task('sendDecision');

        // first input
        cy.getTestElement('@passhphrase/input').type('abc');
        cy.getTestElement('@passphrase/submit-button').click();

        // confirm
        cy.getTestElement('@passphrase/confirm-checkbox').click();
        cy.getTestElement('@passhphrase/input').type('cba');
        cy.getTestElement('@passphrase/submit-button').click();

        // retry
        cy.getTestElement('@passphrase-missmatch/retry-button').click();

        // confirm again
        cy.getTestElement('@passphrase/confirm-checkbox').click();
        cy.getTestElement('@passhphrase/input').type('abc');
        cy.getTestElement('@passphrase/submit-button').click();
    });
});
