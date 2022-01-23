describe('Icons', () => {
    beforeEach(() => {
        cy.viewport(1024, 768);
    });

    [
        'coin-ada',
        'coin-bch',
        'coin-btc',
        'coin-test',
        'coin-btg',
        'coin-dash',
        'coin-dgb',
        'coin-doge',
        'coin-etc',
        'coin-eth',
        'coin-ltc',
        'coin-nem',
        'coin-nmc',
        'coin-rinkeby',
        'coin-trop',
        'coin-txrp',
        'coin-vtc',
        'coin-xem',
        'coin-xlm',
        'coin-xrp',
        'coin-xtz',
        'coin-zec',
        'trezor-logo-horizontal-black',
        'trezor-logo-vertical-black',
        'trezor-logo-symbol-black',
        'trezor-logo-horizontal-white',
        'trezor-logo-vertical-white',
        'trezor-logo-symbol-white',
    ].forEach(testName => {
        it(`${testName}`, () => {
            cy.loadContent('/iframe.html?selectedKind=Logos&selectedStory=All&full=0');
            cy.getTestElement(testName)
                .find('svg')
                .each(el => {
                    cy.get(el).should('be.visible');
                });
            cy.getTestElement(testName).should('be.visible').matchImageSnapshot();
        });
    });
});
