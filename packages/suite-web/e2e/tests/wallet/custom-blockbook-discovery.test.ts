// @group:wallet
// @retry=2

describe('Custom-blockbook-discovery', () => {
    beforeEach(() => {
        cy.task('startEmu', { wipe: true });
        cy.task('setupEmu', {
            needs_backup: true,
            mnemonic: 'all all all all all all all all all all all all',
        });
        cy.task('startBridge');

        cy.viewport(1440, 2560).resetDb();
        cy.prefixedVisit('/settings/coins');
        cy.passThroughInitialRun();
    });

    afterEach(() => {
        cy.task('stopEmu');
    });

    /* Test case
    1. Go to Crypto Settings
    2. Change BTC backend to custom blockbook
    3. Go to Dashboard
    4. Pass discovery
    5. Assert discovery is success (graph render)
    */
    it('BTC-custom-blockbook-discovery', () => {
        //
        // Test preparation
        //
        const customBTCblockbook = 'https://btc1.trezor.io';

        //
        // Test execution
        //
        cy.getTestElement('@settings/wallet/network/btc', { timeout: 30000 })
            .should('exist')
            .trigger('mouseover');
        cy.getTestElement('@settings/wallet/network/btc/advance').click();
        cy.getTestElement('@modal').should('exist');
        cy.getTestElement('@settings/advance/select-type/input').click();
        cy.getTestElement('@settings/advance/select-type/option/blockbook').click();
        cy.getTestElement('@settings/advance/url').type(customBTCblockbook);
        cy.getTestElement('@settings/advance/button/save').click();
        cy.getTestElement('@suite/menu/suite-index').click();

        //
        // Assert
        //
        // when graph becomes visible, discovery was finished
        cy.discoveryShouldFinish();
        cy.getTestElement('@dashboard/graph', { timeout: 30000 }).should('exist');
    });
    /* Test case
    1. Go to Crypto Settings
    2. Change LTC backend to custom blockbook
    3. Go to Dashboard
    4. Pass discovery
    5. Assert discovery is success (graph render)
    */
    it('LTC-custom-blockbook-discovery', () => {
        //
        // Test preparation
        //
        const customBTCblockbook = 'https://ltc1.trezor.io';

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
        cy.getTestElement('@settings/advance/url').type(customBTCblockbook);
        cy.getTestElement('@settings/advance/button/save').click();
        cy.getTestElement('@suite/menu/suite-index').click();

        //
        // Assert
        //
        // when graph becomes visible, discovery was finished
        cy.discoveryShouldFinish();
        cy.getTestElement('@dashboard/graph').should('exist');
    });
});

export {};
