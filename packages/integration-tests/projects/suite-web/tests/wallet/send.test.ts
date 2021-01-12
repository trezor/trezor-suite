// @group:suite
// @retry=2

describe('Send', () => {
    beforeEach(() => {
        cy.task('startEmu', { wipe: true });
        cy.task('setupEmu');
        cy.task('startBridge');
        cy.viewport(1024, 768).resetDb();
        cy.prefixedVisit('/accounts/send');
        cy.mockDiscoveryStart({ fixture: 'with-utxo.json'})
        cy.passThroughInitialRun();
    });

    it('meow', () => {
        cy.getTestElement('outputs[0].amount').type('0.100');
        cy.getTestElement('outputs[0].amount').trigger('mouseover');
        cy.getTestElement('outputs[0].setMax').click();
        cy.wait(10000);
    });
});
