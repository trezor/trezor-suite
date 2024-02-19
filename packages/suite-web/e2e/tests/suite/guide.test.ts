// @group:suite
// @retry=2

describe('Test Guide', () => {
    beforeEach(() => {
        cy.viewport(1440, 2560).resetDb();
        cy.prefixedVisit('/');
        cy.task('startBridge');
    });

    it('Testing guide open / close', () => {
        // Open guide
        cy.getTestElement('@guide/button-open').click();
        cy.getTestElement('@guide/panel').should('be.visible');
        cy.getTestElement('@guide/nodes')
            .first()
            .children()
            .first()
            .then(el => {
                const text = el.text();
                el.click();
                cy.log('text', text);
                cy.getTestElement('@guide/label').should('have.text', text);
            });
        cy.getTestElement('@guide/nodes').first().children().first().click();
        cy.getTestElement('@guide/header-breadcrumb/category-link').click();
        cy.getTestElement('@guide/button-open').should('not.be.visible');
        cy.getTestElement('@guide/button-close').click();
        cy.getTestElement('@guide/panel').should('not.exist');
        cy.getTestElement('@guide/button-open').should('be.visible');

        // Feedback form
        cy.getTestElement('@guide/button-open').click();
        cy.getTestElement('@guide/button-feedback').click();
        cy.getTestElement('@guide/feedback/suggestion').click();
        cy.getTestElement('@guide/feedback/suggestion/5').click();
        cy.getTestElement('@guide/feedback/suggestion-form').type('Hello!');
        cy.getTestElement('@guide/feedback/submit-button').click();
        cy.getTestElement('@toast/user-feedback-send-success').should('be.visible');

        // Guide over modal
        cy.getTestElement('@suite/menu/settings').click();
        cy.getTestElement('@settings/show-log-button').click();
        cy.getTestElement('@guide/button-close').click();
        cy.getTestElement('@guide/button-open').click();
        cy.getTestElement('@guide/panel').should('be.visible');

        // Search input
        cy.getTestElement('@guide/search').type('trezor');
        cy.getTestElement('@guide/search/results').children().should('have.length.above', 0);
        cy.getTestElement('@guide/search').type('meow-wuf-nonsense');
        cy.getTestElement('@guide/search/no-results');
    });

    it('In onboarding with device', () => {
        cy.task('startEmu', { wipe: true });
        cy.getTestElement('@analytics/continue-button').click();
        cy.getTestElement('@analytics/continue-button').click();
        cy.getTestElement('@guide/button-open').click();
        cy.getTestElement('@guide/panel').should('be.visible');
        cy.getTestElement('@guide/button-feedback').click();
        // cypress open todo: panel is probably animated, we need to wait until it is fully expanded
        cy.getTestElement('@guide/panel').screenshot('guide-side-panel', {
            blackout: ['[data-test-id="@guide/support/version"]'],
        });
    });
});

export {};
