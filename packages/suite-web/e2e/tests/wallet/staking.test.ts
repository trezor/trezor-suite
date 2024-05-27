// @group_wallet
// @retry=2

describe('ETH staking', () => {
    beforeEach(() => {
        cy.task('startEmu', { wipe: true });
        cy.task('setupEmu', {
            needs_backup: false,
            mnemonic: 'access juice claim special truth ugly swarm rabbit hair man error bar',
        });
        cy.task('startBridge');

        cy.viewport(1536, 864).resetDb();
        cy.prefixedVisit('/settings/coins');
        cy.passThroughInitialRun();
    });

    afterEach(() => {
        cy.task('stopEmu');
        cy.task('stopBlockbookMock');
    });

    it('checks that staking dashboard works', () => {
        cy.task('startBlockbookMock', { endpointsFile: 'eth-account' }).then(port => {
            const customBlockbook = `ws://localhost:${port}`;
            cy.log(customBlockbook);

            cy.getTestElement('@settings/wallet/network/btc').click();
            cy.getTestElement('@settings/wallet/network/eth', { timeout: 30000 })
                .should('exist')
                .click()
                .trigger('mouseover');
            cy.getTestElement('@settings/wallet/network/eth/advance').click();
            cy.getTestElement('@modal').should('exist');
            cy.getTestElement('@settings/advance/select-type/input').click();
            cy.getTestElement('@settings/advance/select-type/option/blockbook').click();
            cy.getTestElement('@settings/advance/url').type(customBlockbook);
            cy.getTestElement('@settings/advance/button/save').click();

            cy.wait(1000);
            cy.prefixedVisit('/accounts/staking#/eth/0');
            cy.discoveryShouldFinish();

            cy.getTestElement('@account/staking/pending')
                .invoke('text')
                .then(text => {
                    expect(text).to.equal('3,000');
                });
            cy.getTestElement('@account/staking/staked')
                .invoke('text')
                .then(text => {
                    expect(text).to.equal('3,000');
                });
            cy.getTestElement('@account/staking/rewards')
                .invoke('text')
                .then(text => {
                    expect(text).to.equal('1,234');
                });
            cy.getTestElement('@account/staking/unstaking')
                .invoke('text')
                .then(text => {
                    expect(text).to.equal('4,000');
                });
        });
    });
});

export {};
