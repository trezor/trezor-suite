// @stable/suite

describe('Analytics', () => {
    beforeEach(() => {
        cy.task('startEmu', { wipe: true });
        cy.task('setupEmu');
        cy.task('stopEmu');
        cy.viewport(1024, 768).resetDb();
    });

    it('Analytics should be enabled on initial run, then user may disable it and this option should be respected on subsequent reloads', () => {
        cy.prefixedVisit('/');
        cy.getTestElement('@welcome/continue-button').click();
        cy.getTestElement('@analytics/toggle-switch').should('be.checked');
        cy.getTestElement('@analytics/toggle-switch').click({ force: true });
        cy.getTestElement('@analytics/toggle-switch').should('not.be.checked');
        cy.getTestElement('@analytics/go-to-onboarding-button').click();
        cy.getTestElement('@onboarding/skip-button').click();
        cy.getTestElement('@onboarding/skip-button').click();

        cy.log(
            'now entry /settings route directly and see that analytics is NOT enabled after reload',
        );
        cy.prefixedVisit('/settings');

        cy.getTestElement('@modal/connect-device');
        cy.task('startEmu', { wipe: false });
        cy.getTestElement('@analytics/toggle-switch').should('not.be.checked');

        cy.log('enable it again, reload and see it remains checked');
        cy.getTestElement('@analytics/toggle-switch').click({ force: true });
        cy.getTestElement('@analytics/toggle-switch').should('be.checked');
        cy.reload();

        cy.getTestElement('@settings/index').should('be.visible');
        cy.getTestElement('@analytics/toggle-switch').should('be.checked');
    });
});
