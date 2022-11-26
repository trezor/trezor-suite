// @group:wallet
// @retry=2

const downloadsFolder = Cypress.config('downloadsFolder');

describe('Export transactions', () => {
    beforeEach(() => {
        cy.task('rmDir', { dir: downloadsFolder, recursive: true, force: true });
        cy.task('startEmu', { wipe: true });
        cy.task('setupEmu', {
            mnemonic: 'all all all all all all all all all all all all',
        });
        cy.task('startBridge');
        cy.viewport(1080, 1440).resetDb();
        cy.prefixedVisit('/');
        cy.passThroughInitialRun();
        cy.discoveryShouldFinish();
    });

    afterEach(() => {
        cy.task('rmDir', { dir: downloadsFolder, recursive: true, force: true });
    });

    it('Go to account and try to export all possible variants (pdf, csv, json)', () => {
        // go to wallet (account)
        cy.getTestElement('@suite/menu/wallet-index').click();

        // scroll down so that dropdown appears on screen
        cy.getTestElement('@wallet/accounts/export-transactions/dropdown').scrollIntoView({
            offset: { top: -150, left: 0 },
        });

        const extensions = ['pdf', 'csv', 'json'];

        extensions.forEach(extension => {
            cy.getTestElement('@wallet/accounts/export-transactions/dropdown').click({
                scrollBehavior: false,
            });
            cy.getTestElement(`@wallet/accounts/export-transactions/${extension}`).click({
                scrollBehavior: false,
            });
        });

        // assert that downloads folder contains 3 files
        cy.wait(1000);
        cy.task('readDir', downloadsFolder).then(dir => {
            cy.wrap(dir).should('have.length.at.least', 3);
        });
    });
});

export {};
