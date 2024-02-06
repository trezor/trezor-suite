// @group:settings
// @retry=2

describe('ApplicationLog', () => {
    beforeEach(() => {
        cy.task('startEmu', { wipe: true });
        cy.task('setupEmu');
        cy.task('startBridge');
        cy.viewport(1440, 2560).resetDb();
        cy.prefixedVisit('/settings');
        cy.passThroughInitialRun();
    });

    it('there is a button in application setting that opens modal with application logs', () => {
        cy.getTestElement('@settings/menu/general').click({
            scrollBehavior: false,
        });
        cy.getTestElement('@settings/show-log-button').click({
            scrollBehavior: 'bottom',
        });
        cy.getTestElement('@log/export-button');
        // cypress open todo: implement match-image snapshot. blackout stopped working properly
        cy.getTestElement('@modal/application-log').screenshot('log-modal', {
            blackout: ['[data-test="@log/content"]'],
        });

        // todo: check it really exports something;
    });
});

export {};
