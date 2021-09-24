// @group:suite
// @retry=2

describe('Sign and verify', () => {
    beforeEach(() => {
        cy.task('startEmu', { wipe: true, version: Cypress.env('emuVersionT2') });
        cy.task('setupEmu', { mnemonic: 'all all all all all all all all all all all all' });
        cy.task('startBridge');

        cy.viewport(1024, 768).resetDb();
        cy.prefixedVisit('/');
        cy.passThroughInitialRun();
    });

    it('Sign', () => {
        cy.getTestElement('@suite/menu/wallet-index').click();
        cy.getTestElement('@wallet/menu/extra-dropdown').click();
        cy.getTestElement('@wallet/menu/wallet-sign-verify').click();
        cy.getTestElement('@sign-verify/message').type('hello world');
        cy.getTestElement('@sign-verify/sign-address/input').click().type('{downarrow}{enter}');
        // todo: submit fails because we are still waiting for discovery to finish
        cy.getTestElement('@sign-verify/submit').click();
        cy.getConfirmActionOnDeviceModal();
        cy.task('pressYes');
        cy.getTestElement('@sign-verify/signature').should(
            'have.value',
            'JxpInbBQH8LYgBBnRt4/QCV+HBW3hL1o1Yg85biWX1DdBTbfN96pyLL7tLQdYn+VtjvuZWJhEYbUCasjZLmih6w=',
        );
        cy.pause();
    });
});
