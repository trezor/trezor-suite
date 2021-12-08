// @group:settings
// @retry=2

describe('General settings', () => {
    beforeEach(() => {
        cy.task('startEmu', { wipe: true });
        cy.task('setupEmu', { needs_backup: false });
        cy.task('startBridge');
        // use portrait mode monitor to prevent scrolling in settings
        cy.viewport(1080, 1440).resetDb();
        cy.prefixedVisit('/');
        cy.passThroughInitialRun();
        cy.discoveryShouldFinish();
    });

    it('Change settings on "general settings" page', () => {
        // usd is default currency
        cy.getTestElement('@dashboard/index').should('contain', '$0.00');

        // go to settings
        cy.getTestElement('@suite/menu/settings').click();
        cy.getTestElement('@suite/menu/settings-index').click();

        // change fiat
        cy.getTestElement('@settings/fiat-select/input').click();
        cy.getTestElement('@settings/fiat-select/option/eur').click();

        // go to dashboard and check currency
        cy.getTestElement('@suite/menu/suite-index').click();
        cy.getTestElement('@dashboard/index').should('contain', '€0.00');

        // go to settings
        cy.getTestElement('@suite/menu/settings').click();
        cy.getTestElement('@suite/menu/settings-index').click();

        // change language
        cy.getTestElement('@settings/language-select/input').click();
        cy.getTestElement('@settings/language-select/option/en').click();
        cy.getTestElement('@settings/language-select/input').should('contain', 'English');

        // change dark mode
        cy.getTestElement('@theme/color-scheme-select/input').click();
        cy.getTestElement('@theme/color-scheme-select/option/dark').click();
        cy.getTestElement('@theme/color-scheme-select/input').should('contain', 'Dark');

        // toggle analytics
        cy.getTestElement('@analytics/toggle-switch').should('be.checked');
        cy.getTestElement('@analytics/toggle-switch').click({ force: true });
        cy.getTestElement('@analytics/toggle-switch').should('not.be.checked');

        // there is suite version also listed
        cy.contains('Suite version');
        cy.contains('You are currently running version');

        // and reset app button - wipes db, reloads app, shows onboarding again
        cy.getTestElement('@settings/reset-app-button').click();
        cy.getTestElement('@onboarding/welcome');
    });
});
