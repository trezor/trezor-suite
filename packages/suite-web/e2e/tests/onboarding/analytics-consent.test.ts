// @group_device-management
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

    it('shows analytics consent and then goes to /accounts device', () => {
        cy.task('startEmu', { wipe: true });
        cy.task('setupEmu', {
            needs_backup: false,
        });
        cy.prefixedVisit('/accounts');

        acceptAnalyticsConsentOnInitializedDevice();

        cy.getTestElement('@onbarding/viewOnly/enable').click();
        cy.getTestElement('@suite-layout/body').should('be.visible');
        cy.getTestElement('@account-menu/btc/normal/0').click();
        cy.getTestElement('@wallet/menu/wallet-send');
    });
});

export {};
