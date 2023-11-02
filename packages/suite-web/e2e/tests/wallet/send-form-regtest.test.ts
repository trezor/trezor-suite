// @group:wallet
// @retry=2

describe('Send form for bitcoin', () => {
    const ADDRESS_INDEX_1 = 'bcrt1qkvwu9g3k2pdxewfqr7syz89r3gj557l374sg5v';

    beforeEach(() => {
        cy.task('startEmu', { wipe: true });
        cy.task('setupEmu', {
            needs_backup: true,
            mnemonic: 'all all all all all all all all all all all all',
        });
        cy.task('startBridge');
        cy.viewport(1080, 1440).resetDb();
        cy.prefixedVisit('/');
        cy.passThroughInitialRun();
        cy.discoveryShouldFinish();
        cy.enableRegtestAndGetCoins({
            payments: [
                {
                    address: ADDRESS_INDEX_1,
                    amount: 1,
                },
            ],
        });
        // navigate to the send form
        cy.getTestElement('@suite/menu/wallet-index').click();
        cy.getTestElement('@account-menu/regtest/normal/0/label').click();
        cy.getTestElement('@wallet/menu/wallet-send').click();
    });

    it('add and remove output in send form, toggle form options, input data', () => {
        // test adding and removing outputs
        cy.getTestElement('outputs.0.amount').type('0.3');
        cy.getTestElement('add-output').click();
        cy.getTestElement('outputs.1.amount').type('0.6');

        cy.getTestElement('outputs.0.remove').click();

        cy.wait(10); // wait for animation
        cy.getTestElement('outputs.0.amount').should('be.visible'); // 1 output is visible

        cy.getTestElement('outputs.0.address').type('bcrt1qkvwu9g3k2pdxewfqr7syz89r3gj557l374sg5v');

        // add locktime
        cy.getTestElement('add-locktime-button').click();

        cy.getTestElement('locktime-input').type('100');

        // assert final state of form using screenshot
        cy.getTestElement('@wallet/send/outputs-and-options').matchImageSnapshot('bitcoin-send');

        cy.getTestElement('@send/review-button').click();
        cy.getTestElement('@prompts/confirm-on-device');
        cy.task('pressYes');
        cy.task('pressYes');
        cy.task('pressYes');

        // broadcast is off due to locktime, so we do not see '@modal/send'
        cy.getTestElement('@send/copy-raw-transaction');
    });

    it('switch display units to satoshis, fill a form in satoshis and send', () => {
        cy.getTestElement('amount-unit-switch/regtest').click();

        // test adding and removing outputs
        cy.getTestElement('outputs.0.amount').type('600');
        cy.getTestElement('add-output').click();
        cy.getTestElement('outputs.1.amount').type('800');
        cy.getTestElement('outputs.0.remove').click();
        cy.wait(10); // wait for animation
        cy.getTestElement('outputs.0.amount').should('be.visible'); // 1 output is visible

        // assert final state of form using screenshot
        cy.getTestElement('@wallet/send/outputs-and-options').matchImageSnapshot(
            'bitcoin-send-sats',
        );
    });

    it('send tx with OP_RETURN output', () => {
        cy.getTestElement('outputs.0.address').type('bcrt1qkvwu9g3k2pdxewfqr7syz89r3gj557l374sg5v');
        cy.getTestElement('outputs.0.amount').type('0.1');
        cy.getTestElement('@send/header-dropdown').click();
        cy.getTestElement('@send/header-dropdown/opreturn').click();

        cy.getTestElement('outputs.1.dataAscii').type('meow');
        cy.getTestElement('@send/review-button').click();
        cy.task('pressYes');
        cy.task('pressYes');
        cy.task('pressYes');
        cy.task('pressYes');
        cy.task('pressYes');

        cy.getTestElement('@modal/send').click();
        cy.getTestElement('@wallet/accounts/transaction-list/group/0').should(
            'contain',
            'OP_RETURN (meow)',
        );
    });
});

export {};
