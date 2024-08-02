// @group_suite
// @retry=2

const acceptAnalyticsConsentOnInitializedDevice = () => {
    cy.getTestElement('@analytics/consent');
    cy.getTestElement('@analytics/continue-button').click();
    cy.getTestElement('@onboarding/exit-app-button').click();
};

describe('Onboarding - analytics consent', () => {
    beforeEach(() => {
        cy.task('startBridge');
        cy.viewport(1440, 2560).resetDb();
    });

    it('analytics consent appears on any route that is visited initially. this time /accounts', () => {
        cy.task('startEmu', { wipe: true });
        cy.task('setupEmu', {
            needs_backup: false,
        });
        cy.prefixedVisit('/accounts');

        acceptAnalyticsConsentOnInitializedDevice();

        cy.getTestElement('@onboarding/viewOnly/enable').click();
        cy.getTestElement('@suite-layout/body').should('be.visible');
        cy.getTestElement('@account-menu/btc/normal/0').click();
        cy.getTestElement('@wallet/menu/wallet-send');
    });
});

export {};
