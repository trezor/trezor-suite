// @group:wallet
// @retry=2

import { rerouteMetadataToMockProvider, stubOpen } from '../../stubs/metadata';

describe('Import a BTC csv file', () => {
    beforeEach(() => {
        cy.task('startEmu', { wipe: true });
        cy.task('setupEmu');
        cy.task('startBridge');
        cy.task('metadataStartProvider', 'dropbox');

        cy.viewport(1080, 1440).resetDb();
        cy.prefixedVisit('/', {
            onBeforeLoad: (win: Window) => {
                cy.stub(win, 'open').callsFake(stubOpen(win));
                cy.stub(win, 'fetch').callsFake(rerouteMetadataToMockProvider);
            },
        });
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
        cy.getTestElement('@account-menu/btc/normal/0').click();
        cy.hoverTestElement("@metadata/accountLabel/m/84'/0'/0'/hover-container");
        cy.getTestElement("@metadata/accountLabel/m/84'/0'/0'/add-label-button")
            .should('be.visible')
            .click();

        cy.passThroughInitMetadata('dropbox');
        cy.getTestElement('@wallet/menu/wallet-send').click();

        //
        // Test execution
        //
        cy.getTestElement('@send/header-dropdown').click();
        cy.getTestElement('@send/header-dropdown/import').click();
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
                cy.getTestElement('outputs.0.address')
                    .should('be.visible')
                    .should('have.value', firstAddress);
                cy.getTestElement('outputs.1.address')
                    .should('be.visible')
                    .should('have.value', secondAddress);
                cy.log(secondAddress);
            });
        });
    });
});

export {};
