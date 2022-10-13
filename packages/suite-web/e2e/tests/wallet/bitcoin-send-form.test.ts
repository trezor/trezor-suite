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
        cy.getTestElement('outputs[0].amount').type('0.3');
        cy.getTestElement('add-output').click();
        cy.getTestElement('outputs[1].amount').type('0.6');
        cy.getTestElement('outputs[0].remove').click();
        cy.wait(10); // wait for animation
        cy.getTestElement('outputs[0].amount').should('be.visible'); // 1 output is visible

        // add locktime
        cy.getTestElement('add-locktime-button').click();
        cy.getTestElement('locktime-input').type('100');

        // change broadcast option
        cy.getTestElement('broadcast-button').click();

        // todo: input address. there are missing validators for currency REGTEST

        // assert final state of form using screenshot
        cy.getTestElement('@wallet/send/outputs-and-options').matchImageSnapshot('bitcoin-send');
    });

    it('switch display units to satoshis, fill a form in satoshis and send', () => {
        cy.getTestElement('amount-unit-switch/regtest').click();

        // test adding and removing outputs
        cy.getTestElement('outputs[0].amount').type('600');
        cy.getTestElement('add-output').click();
        cy.getTestElement('outputs[1].amount').type('800');
        cy.getTestElement('outputs[0].remove').click();
        cy.wait(10); // wait for animation
        cy.getTestElement('outputs[0].amount').should('be.visible'); // 1 output is visible

        // assert final state of form using screenshot
        cy.getTestElement('@wallet/send/outputs-and-options').matchImageSnapshot(
            'bitcoin-send-sats',
        );
    });
});

// todo: send tx
