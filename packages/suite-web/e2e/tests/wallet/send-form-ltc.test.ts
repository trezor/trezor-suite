// @group:wallet
// @retry=2

describe('LTC send form with mocked blockbook', () => {
    beforeEach(() => {
        cy.task('startEmu', { wipe: true });
        cy.task('setupEmu', {
            needs_backup: false,
            mnemonic: 'access juice claim special truth ugly swarm rabbit hair man error bar',
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

    it('spend mimble-wimble output', () => {
        //
        // Test preparation
        //
        cy.task('startBlockbookMock', { endpointsFile: 'send-form-ltc-mimble-wimble' }).then(
            port => {
                const customBlockbook = `ws://localhost:${port}`;
                cy.log(customBlockbook);

                //
                // Test execution
                //
                cy.getTestElement('@settings/wallet/network/btc').click();
                cy.getTestElement('@settings/wallet/network/ltc', { timeout: 30000 })
                    .should('exist')
                    .click()
                    .trigger('mouseover');
                cy.getTestElement('@settings/wallet/network/ltc/advance').click();
                cy.getTestElement('@modal').should('exist');
                cy.getTestElement('@settings/advance/select-type/input').click();
                cy.getTestElement('@settings/advance/select-type/option/blockbook').click();
                cy.getTestElement('@settings/advance/url').type(customBlockbook);
                cy.getTestElement('@settings/advance/button/save').click();

                cy.prefixedVisit('/accounts/send#/ltc/0');
                cy.discoveryShouldFinish();

                cy.getTestElement('broadcast-button').click();
                cy.getTestElement('outputs[0].address').type(
                    'ltc1q0lqwsyygg9frql6ujjfhevfculsxwledvv6yzc',
                );
                cy.getTestElement('outputs[0].setMax').click({ force: true });

                // cy.pause();
                // TDD TODO: click on review button, now it fails "slice out of bounds "
            },
        );
    });
});

export {};
