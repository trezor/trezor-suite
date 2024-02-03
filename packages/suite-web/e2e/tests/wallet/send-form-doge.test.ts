// @group:wallet
// @retry=2

describe('Doge send form with mocked blockbook', () => {
    beforeEach(() => {
        cy.task('startEmu', { wipe: true });
        cy.task('setupEmu', {
            needs_backup: false,
            mnemonic:
                'fantasy auto fancy access ring spring patrol expect common tape talent annual',
        });
        cy.task('startBridge');

        cy.viewport(1080, 1440).resetDb();
        cy.prefixedVisit('/settings/coins');
        cy.passThroughInitialRun();
    });

    afterEach(() => {
        cy.task('stopEmu');
        cy.task('stopBlockbookMock');
    });

    it('spend an output with amount over MAX_SAFE_INTEGER', () => {
        //
        // Test preparation
        //

        cy.task('startBlockbookMock', { endpointsFile: 'send-form-doge' }).then(port => {
            const customBlockbook = `ws://localhost:${port}`;
            cy.log(customBlockbook);

            //
            // Test execution
            //
            cy.getTestElement('@settings/wallet/network/btc').click();
            cy.getTestElement('@settings/wallet/network/doge', { timeout: 30000 })
                .should('exist')
                .click()
                .trigger('mouseover');
            cy.getTestElement('@settings/wallet/network/doge/advance').click();
            cy.getTestElement('@modal').should('exist');
            cy.getTestElement('@settings/advance/select-type/input').click();
            cy.getTestElement('@settings/advance/select-type/option/blockbook').click();
            cy.getTestElement('@settings/advance/url').type(customBlockbook);
            cy.getTestElement('@settings/advance/button/save').click();

            cy.wait(1000);
            cy.prefixedVisit('/accounts/send#/doge/0');
            cy.discoveryShouldFinish();

            cy.getTestElement('broadcast-button').click();

            cy.getTestElement('outputs.0.address').type('DJk8vtoEuNGtT4YRNoqVxWyRh6kM3s8bzc');
            cy.getTestElement('outputs.0.amount').type('115568568500');
            cy.getTestElement('@send/review-button').click();
            cy.getTestElement('@prompts/confirm-on-device');
            cy.task('pressYes');
            cy.task('pressYes');
            cy.task('pressYes');
            cy.getTestElement('@send/copy-raw-transaction');
        });
    });
});

export {};
