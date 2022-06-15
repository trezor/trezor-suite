// @group:wallet
// @retry=2

describe('Import a BTC csv file', () => {
    beforeEach(() => {
        cy.task('startEmu', { wipe: true });
        cy.task('setupEmu');
        cy.task('startBridge');
        cy.viewport(1080, 1440).resetDb();
        cy.prefixedVisit('/');
        cy.passThroughInitialRun();
        cy.discoveryShouldFinish();
    });

    /**
     * 1. click on `Accounts`
     * 2. select a BTC account if it’s not selected
     * 3. click on `Send`
     * 4. click on `...` in the form header
     * 5. click on `Import addresses from CSV`
     * 6. add the test data csv file
     */
    it('Go to BTC send form and import a csv', () => {
        const csvFile = 'btcTest.csv';
        //
        // Test preparation
        //
        cy.getTestElement('@suite/menu/wallet-index').click();
        cy.getTestElement('@account-menu/btc/normal/0').click();
        cy.getTestElement('@wallet/menu/wallet-send').click();

        //
        // Test execution
        //
        cy.getTestElement('@send/header-dropdown').click();
        cy.contains('Import').click();
        cy.getTestElement('@modal').then(fileUploadModal => {
            cy.wrap(fileUploadModal)
                .find('input[type=file]')
                .attachFile(csvFile, { subjectType: 'drag-n-drop' });
            cy.getTestElement('@modal').should('not.exist');
        });

        //
        // Assert
        //
        cy.fixture(csvFile).then(data => {
            cy.task('csvToJson', data).then((processedData: any) => {
                const firstAddress: string = processedData[0].address;
                const secondAddress: string = processedData[1].address;
                // process data
                cy.getTestElement('outputs[0].address')
                    .should('be.visible')
                    .invoke('val')
                    .should('equal', firstAddress);
                cy.getTestElement('outputs[1].address')
                    .should('be.visible')
                    .invoke('val')
                    .should('equal', secondAddress);
                cy.log(secondAddress);
            });
        });
    });
});
