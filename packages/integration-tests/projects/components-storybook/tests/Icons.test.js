describe('Icons', () => {
    beforeEach(() => {
        cy.viewport(1024, 768);
    });

    [
        'icon-arrow-down',
        'icon-arrow-up',
        'icon-arrow-left',
        'icon-arrow-right',
        'icon-check',
        'icon-check-active',
        'icon-coins',
        'icon-copy',
        'icon-cross',
        'icon-dashboard',
        'icon-exchange',
        'icon-info',
        'icon-info-active',
        'icon-log',
        'icon-menu',
        'icon-more',
        'icon-passwords',
        'icon-plus',
        'icon-qr',
        'icon-question',
        'icon-question-active',
        'icon-receive',
        'icon-refresh',
        'icon-search',
        'icon-send',
        'icon-settings',
        'icon-sign',
        'icon-sort',
        'icon-support',
        'icon-tips',
        'icon-transactions',
        'icon-trezor',
        'icon-wallet',
        'icon-wallet-hidden',
        'icon-t1',
        'icon-t2',
        'icon-show',
        'icon-hide',
        'icon-back',
        'icon-download',
        'icon-edit',
        'icon-warning',
        'icon-warning-active',
        'icon-label',
        'icon-label-active',
        'icon-todo',
        'icon-pin',
        'icon-backup',
        'icon-discreet',
        'icon-collapse',
        'icon-notification',
        'icon-shop',
    ].forEach(testName => {
        it(`${testName}`, () => {
            cy.loadContent('/iframe.html?selectedKind=Icons&selectedStory=All&full=0');
            cy.getTestElement(testName)
                .find('svg')
                .each(el => {
                    cy.get(el).should('be.visible');
                });
            cy.getTestElement(testName).should('be.visible').matchImageSnapshot();
        });
    });
});
