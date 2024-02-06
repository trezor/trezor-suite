// @group:wallet
// @retry=2

const SEED_SIGN = 'all all all all all all all all all all all all';
const MESSAGE_SIGN = 'hello world';
const SIGNATURE_SIGN =
    '0a172eaac00636dbc124c170e5afa7665cdeed65b59449ee1bbb6e57b1cfbf7971a1c88b48cacd17ec585918cd849c36a016e99ecfd757b947c732e7470b9b3d1b';
const ADDRESS_SIGN = '0x73d0385F4d8E00C5e6504C6030F47BF6212736A8';

describe('Sign and verify ETH', () => {
    beforeEach(() => {
        cy.task('startEmu', { wipe: true });
        cy.task('setupEmu', {
            needs_backup: false,
            mnemonic: SEED_SIGN,
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
     * 1. Pass onboarding
     * 2. Navigate to settings/coins and Disable BTC and enable ETH
     * 3. Pass discovery
     * 4. Navigate to Sign and verify section
     * 5. Fill out fields and sign message.
     * 6. Check that notification was rendered and correct message was generated
     * 7. Repeat fo verify dialogue
     */
    it('Sign ETH', () => {
        //
        // Test preparation
        //
        cy.getTestElement('@settings/menu/wallet').click();
        cy.getTestElement('@settings/wallet/network/btc').click({ force: true });
        cy.getTestElement('@settings/wallet/network/eth').click({ force: true });
        //
        // Test execution
        //
        cy.getTestElement('@suite/menu/suite-index').click();
        cy.discoveryShouldFinish();
        cy.getTestElement('@account-menu/eth/normal/0').click();

        cy.getTestElement('@wallet/menu/extra-dropdown').click();
        cy.getTestElement('@wallet/menu/wallet-sign-verify').click();
        cy.getTestElement('@sign-verify/message').type(MESSAGE_SIGN);
        cy.getTestElement('@sign-verify/submit').click();
        cy.getConfirmActionOnDeviceModal().task('pressYes');
        cy.getConfirmActionOnDeviceModal().task('pressYes');
        cy.getTestElement('@sign-verify/signature').should('have.value', SIGNATURE_SIGN);

        //
        // Assert
        //
        cy.getTestElement('@toast/sign-message-success');
    });

    it('Verify ETH', () => {
        //
        // Test preparation
        //
        cy.getTestElement('@settings/menu/wallet').click();
        cy.getTestElement('@settings/wallet/network/btc').click({ force: true });
        cy.getTestElement('@settings/wallet/network/eth').click({ force: true });
        //
        // Test execution
        //
        cy.getTestElement('@suite/menu/suite-index').click();
        cy.discoveryShouldFinish();
        cy.getTestElement('@account-menu/eth/normal/0').click();

        cy.getTestElement('@wallet/menu/extra-dropdown').click();
        cy.getTestElement('@wallet/menu/wallet-sign-verify').click();
        cy.getTestElement('@sign-verify/navigation/verify').click();
        cy.getTestElement('@sign-verify/message').type(MESSAGE_SIGN);
        cy.getTestElement('@sign-verify/select-address').type(ADDRESS_SIGN);
        cy.getTestElement('@sign-verify/signature').type(SIGNATURE_SIGN);
        cy.getTestElement('@sign-verify/submit').click();
        cy.getConfirmActionOnDeviceModal().task('pressYes');
        cy.getConfirmActionOnDeviceModal().task('pressYes');
        cy.getConfirmActionOnDeviceModal().task('pressYes');
        //
        // Assert
        //
        cy.getTestElement('@toast/verify-message-success');
    });
});

export {};
