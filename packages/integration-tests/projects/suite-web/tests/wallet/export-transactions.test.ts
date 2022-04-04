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

        // export pdf
        cy.getTestElement('@wallet/accounts/export-transactions/dropdown').click({
            scrollBehavior: false,
        });
        cy.getTestElement('@wallet/accounts/export-transactions/pdf').click({
            scrollBehavior: false,
        });

        // export csv
        cy.getTestElement('@wallet/accounts/export-transactions/dropdown').click({
            scrollBehavior: false,
        });
        cy.getTestElement('@wallet/accounts/export-transactions/csv').click({
            scrollBehavior: false,
        });

        // export json
        cy.getTestElement('@wallet/accounts/export-transactions/dropdown').click({
            scrollBehavior: false,
        });
        cy.getTestElement('@wallet/accounts/export-transactions/json').click({
            scrollBehavior: false,
        });

        // assert that downloads folder contains 3 files
        cy.wait(500);
        cy.task('readDir', downloadsFolder).then(dir => {
            cy.wrap(dir).should('have.length', 3);
        });
    });
});
