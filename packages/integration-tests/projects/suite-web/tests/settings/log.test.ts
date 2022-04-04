// @group:settings
// @retry=2

describe('Log', () => {
    beforeEach(() => {
        cy.task('startEmu', { wipe: true });
        cy.task('setupEmu');
        cy.task('startBridge');
        cy.viewport(1080, 1440).resetDb();
        cy.prefixedVisit('/');
        cy.passThroughInitialRun();
        cy.discoveryShouldFinish();
        cy.getTestElement('@suite/menu/settings').click();
    });

    it('there is a button in application setting that opens modal with application logs', () => {
        cy.getTestElement('@settings/menu/general').click({
            scrollBehavior: false,
        });
        cy.getTestElement('@settings/show-log-button').click({
            scrollBehavior: 'bottom',
        });
        cy.getTestElement('@log/copy-button');
        // cypress open todo: implement match-image snapshot. blackout stopped working properly
        cy.getTestElement('@modal/log').screenshot('log-modal', {
            blackout: ['[data-test="@log/content"]'],
        });

        // todo: check that we really copied something;
    });
});
