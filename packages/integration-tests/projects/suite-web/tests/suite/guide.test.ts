// @group:suite
// @retry=2

describe('Test Guide', () => {
    beforeEach(() => {
        cy.task('startEmu', { wipe: true });
        cy.task('setupEmu');
        cy.task('startBridge');
        cy.viewport(1024, 768).resetDb();
        cy.prefixedVisit('/');
        cy.passThroughInitialRun();
    });

    it('Testing guide open / close', () => {
        // Open guide
        cy.getTestElement('@guide/button-open').click();
        cy.getTestElement('@guide/panel').should('be.visible');
        cy.getTestElement('@guide/button-open').should('not.be.visible');

        // Close guide
        cy.getTestElement('@guide/button-close').click();
        cy.getTestElement('@guide/panel').should('not.exist');
        cy.getTestElement('@guide/button-open').should('be.visible');
    });

    /*
     * Skipping this test as it is dependent on current structure of guide.
     * As the structure and articles of the guide are constantly changing, this test would have to be constantly updated.
     * For now, the tests are skipped to avoid wasting time.
     * GitHub issue #4585 has been created. It's goal is to create generic test.
     */
    it.skip('navigates though guide structure and articles', () => {
        cy.getTestElement('@guide/button-open').click();
        cy.getTestElement('@guide/category/privacy').click();
        cy.getTestElement('@guide/button-back').click();
        cy.getTestElement('@guide/category/suite-basics').click();
        cy.getTestElement('@guide/node/suite-basics/trade.md').click();
        cy.getTestElement('@guide/headerBreadcrumb/categoryLink').click();
        cy.getTestElement('@guide/node/suite-basics/trade.md').click();
        cy.getTestElement('@guide/headerBreadcrumb/previousCategoryLink').click();
        cy.getTestElement('@guide/button-close').click();
        cy.getTestElement('@guide/button-open').click();
        cy.getTestElement('@guide/category/privacy').should('be.visible');
        cy.getTestElement('@guide/button-close').click();
    });

    it('fills feedback form', () => {
        cy.getTestElement('@guide/button-open').click();
        cy.getTestElement('@guide/button-feedback').click();
        cy.getTestElement('@guide/feedback/suggestion').click();
        cy.getTestElement('@guide/feedback/suggestion/5').click();
        cy.getTestElement('@guide/feedback/suggestion-form').type('Hello!');
    });
});
