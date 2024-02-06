// @group:wallet
// @retry=2

const SEED = 'all all all all all all all all all all all all';
const PATH = "m/84'/0'/0'/0/3";
const ADDRESS = 'bc1q6hr68ewf72l6r7cj6ut286x0xkwg5706jq450u';
const MESSAGE = 'hello world';
const SIGNATURE =
    'JxpInbBQH8LYgBBnRt4/QCV+HBW3hL1o1Yg85biWX1DdBTbfN96pyLL7tLQdYn+VtjvuZWJhEYbUCasjZLmih6w=';
const ELECTRUM_SIGNATURE =
    'HxpInbBQH8LYgBBnRt4/QCV+HBW3hL1o1Yg85biWX1DdBTbfN96pyLL7tLQdYn+VtjvuZWJhEYbUCasjZLmih6w=';

describe('Sign and verify', () => {
    beforeEach(() => {
        cy.task('startEmu', { wipe: true });
        cy.task('setupEmu', { mnemonic: SEED });
        cy.task('startBridge');

        cy.viewport(1440, 2560).resetDb();
        cy.prefixedVisit('/');
        cy.passThroughInitialRun();

        cy.discoveryShouldFinish();
        cy.getTestElement('@account-menu/btc/normal/0').click();

        cy.getTestElement('@wallet/menu/extra-dropdown').click();
        cy.getTestElement('@wallet/menu/wallet-sign-verify').click();
    });

    /* Test case
     * 1. Pass onboarding.
     * 2. Navigate to wallet-index.
     * 3. Open sign and verify dialogue.
     * 4. Fill in message to sign
     * 5. Select address
     * 6. Press Sign and confirm on device
     * 7. Compare signature with expected value
     */

    it('Sign', () => {
        cy.getTestElement('@sign-verify/message').type(MESSAGE);
        cy.getTestElement('@sign-verify/sign-address/input').click();
        cy.getTestElement(`@sign-verify/sign-address/option/${PATH}`).click();
        cy.getTestElement('@sign-verify/sign-address/input').should('contain', ADDRESS);
        cy.getTestElement('@sign-verify/submit').click();
        cy.getConfirmActionOnDeviceModal().task('pressYes');
        cy.getConfirmActionOnDeviceModal().task('pressYes');
        cy.getTestElement('@sign-verify/signature').should('have.value', SIGNATURE);
    });

    it('Sign Electrum', () => {
        cy.getTestElement('@sign-verify/message').type(MESSAGE);
        cy.getTestElement('@sign-verify/sign-address/input').click();
        cy.getTestElement(`@sign-verify/sign-address/option/${PATH}`).click();
        cy.getTestElement('@sign-verify/sign-address/input').should('contain', ADDRESS);
        cy.getTestElement('@sign-verify/format').within(() =>
            cy.getTestElement(`select-bar/${true}`).click(),
        );
        cy.getTestElement('@sign-verify/submit').click();
        cy.getConfirmActionOnDeviceModal().task('pressYes');
        cy.getConfirmActionOnDeviceModal().task('pressYes');
        cy.getTestElement('@sign-verify/signature').should('have.value', ELECTRUM_SIGNATURE);
    });

    it('Verify', () => {
        cy.getTestElement('@sign-verify/navigation/verify').click();
        cy.getTestElement('@sign-verify/message').type(MESSAGE);
        cy.getTestElement('@sign-verify/select-address').type(ADDRESS);
        cy.getTestElement('@sign-verify/signature').type(SIGNATURE);
        cy.getTestElement('@sign-verify/submit').click();
        cy.getConfirmActionOnDeviceModal().task('pressYes');
        cy.getConfirmActionOnDeviceModal().task('pressYes');
        // since 2.4.4 there is another screen that needs to be confirmed
        cy.getConfirmActionOnDeviceModal().task('pressYes');
        cy.getTestElement('@toast/verify-message-success');
    });
});

export {};
