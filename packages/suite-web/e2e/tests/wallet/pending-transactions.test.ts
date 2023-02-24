// @group:wallet
// @retry=2

describe('Use regtest to test pending transactions', () => {
    const ADDRESS_ACCOUNT_1_INDEX_1 = 'bcrt1qkvwu9g3k2pdxewfqr7syz89r3gj557l374sg5v';
    const ADDRESS_ACCOUNT_2_INDEX_1 = 'bcrt1q7r9yvcdgcl6wmtta58yxf29a8kc96jkyyk8fsw';
    const ADDRESS_ACCOUNT_3_INDEX_1 = 'bcrt1q3j2fqzfqndv4gxhf9q0nvvxgceur8mhum8xpwj'; // miner

    beforeEach(() => {
        cy.task('startEmu', { wipe: true });
        cy.task('setupEmu', {
            mnemonic: 'all all all all all all all all all all all all',
        });
        cy.task('startBridge');
        cy.viewport(1080, 1440).resetDb();
        cy.prefixedVisit('/settings/coins');
        cy.passThroughInitialRun();
        cy.toggleDebugModeInSettings();
        cy.getTestElement('@settings/wallet/network/btc').click({ force: true });
        cy.getTestElement('@settings/wallet/network/regtest').click({ force: true });
        // send 1 regtest bitcoin to first address in the derivation path
        [
            { address: ADDRESS_ACCOUNT_1_INDEX_1, amount: 10 },
            { address: ADDRESS_ACCOUNT_2_INDEX_1, amount: 10 },
        ].forEach(payment => {
            cy.task('sendToAddressAndMineBlock', {
                address: payment.address,
                btc_amount: payment.amount,
            });
        });
        cy.task('mineBlocks', { block_amount: 1 });
    });

    it('send couple of pending txs and check that they are pending until mined', () => {
        cy.getTestElement('@suite/menu/wallet-index').click();
        cy.discoveryShouldFinish();
        cy.getTestElement('@account-menu/regtest/normal/0/label').click();

        // create 2 transactions (one self, one fund another account of mine)
        [ADDRESS_ACCOUNT_1_INDEX_1, ADDRESS_ACCOUNT_2_INDEX_1].forEach((address, index) => {
            cy.getTestElement('@wallet/menu/wallet-send').click();
            cy.getTestElement('outputs[0].amount').type('0.3');
            cy.getTestElement('outputs[0].address').type(address);
            cy.getTestElement('@send/review-button').click();
            cy.getTestElement('@prompts/confirm-on-device');
            cy.task('pressYes');
            cy.task('pressYes');
            cy.task('pressYes');
            cy.getTestElement('@modal/send').click();
            cy.getTestElement('@transaction-group/pending/count').contains(index + 1);
            cy.getTestElement('@wallet/accounts/transaction-list/group/0').within(() => {
                cy.getTestElement(`@transaction-item/0/heading`).click({
                    scrollBehavior: 'bottom',
                });
            });
            cy.getTestElement('@tx-detail/txid-value').then($el => {
                cy.task('set', { key: address, value: $el.text() });
            });

            cy.getTestElement('@modal/close-button').click();
        });

        // account 1 has 2 pending transactions (self and sent)
        cy.getTestElement('@wallet/accounts/transaction-list/group/0').within(() => {
            cy.getTestElement('@transaction-item/0/heading').contains('Sending REGTEST');
            cy.getTestElement('@transaction-item/1/heading').contains('Sending REGTEST to myself');
        });

        // account 2 has 1 pending transaction (receive)
        cy.getTestElement('@account-menu/regtest/normal/1').click();
        cy.getTestElement('@wallet/accounts/transaction-list/group/0').within(() => {
            cy.getTestElement('@transaction-item/0/heading').contains('Receiving REGTEST');
        });

        // while observing account 1, sent transaction is mined
        cy.getTestElement('@account-menu/regtest/normal/0').click();
        cy.getTestElement('@wallet/accounts/transaction-list/group/0').within(() => {
            cy.getTestElement('@transaction-item/0/heading').contains('Sending REGTEST');
            cy.getTestElement('@transaction-item/1/heading').contains('Sending REGTEST to myself');
        });

        // mine the "not-self" transaction
        cy.task('get', { key: ADDRESS_ACCOUNT_2_INDEX_1 }).then(txid => {
            cy.wait(1000);
            cy.task('generateBlock', {
                address: ADDRESS_ACCOUNT_3_INDEX_1,
                txids: [txid],
            });
        });

        // which causes sent transaction to disappear, self transaction stays
        cy.getTestElement('@wallet/accounts/transaction-list/group/0').within(() => {
            cy.getTestElement('@transaction-item/0/heading').contains('Sending REGTEST to myself');
            cy.getTestElement('@transaction-group/pending/count').contains(1);
        });

        // receive pending transaction on account2 is now mined as well
        cy.getTestElement('@account-menu/regtest/normal/1').click();
        cy.getTestElement('@wallet/accounts/transaction-list/group/0').within(() => {
            cy.getTestElement(`@transaction-item/0/heading`).contains('Received REGTEST');
        });
    });
});

export {};
