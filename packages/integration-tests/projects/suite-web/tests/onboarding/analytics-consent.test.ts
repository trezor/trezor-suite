// @group:onboarding
// @retry=2

describe('Onboarding - analytics consent', () => {
    beforeEach(() => {
        cy.task('startBridge');
        cy.viewport(1080, 1440).resetDb();
    });

    it('shows analytics consent when going to settings and back on non-initialized T1 device', () => {
        cy.task('startEmu', { version: '1-latest', wipe: true });
        cy.prefixedVisit('/');

        cy.getTestElement('@analytics/consent');
        cy.getTestElement('@suite/menu/settings').click();
        cy.getTestElement('@settings/menu/close').click();

        cy.getTestElement('@analytics/consent');
        cy.getTestElement('@onboarding/continue-button').click();
        cy.getTestElement('@onboarding/continue-button').click();

        cy.getTestElement('@onboarding-layout/body').should('be.visible');
    });

    it('shows analytics consent when going to settings and back on non-initialized T2 device', () => {
        cy.task('startEmu', { wipe: true });
        cy.prefixedVisit('/');

        cy.getTestElement('@analytics/consent');
        cy.getTestElement('@suite/menu/settings').click();
        cy.getTestElement('@settings/menu/close').click();

        cy.getTestElement('@analytics/consent');
        cy.getTestElement('@onboarding/continue-button').click();
        cy.getTestElement('@onboarding/continue-button').click();

        cy.getTestElement('@onboarding-layout/body').should('be.visible');
    });

    it('shows analytics consent when going to settings and back on initialized T1 device', () => {
        cy.task('startEmu', { version: '1-latest', wipe: true });
        cy.task('setupEmu', {
            needs_backup: false,
        });
        cy.prefixedVisit('/');

        cy.getTestElement('@analytics/consent');
        cy.getTestElement('@suite/menu/settings').click();
        cy.getTestElement('@settings/menu/close').click();

        cy.getTestElement('@analytics/consent');
        cy.getTestElement('@onboarding/continue-button').click();
        cy.getTestElement('@onboarding/exit-app-button').click();

        cy.getTestElement('@suite-layout/body').should('be.visible');
        cy.getTestElement('@settings/menu/close').should('be.visible');
    });

    it('shows analytics consent when going to settings and back on initialized T2 device', () => {
        cy.task('startEmu', { wipe: true });
        cy.task('setupEmu', {
            needs_backup: false,
        });
        cy.prefixedVisit('/');

        cy.getTestElement('@analytics/consent');
        cy.getTestElement('@suite/menu/settings').click();
        cy.getTestElement('@settings/menu/close').click();

        cy.getTestElement('@analytics/consent');
        cy.getTestElement('@onboarding/continue-button').click();
        cy.getTestElement('@onboarding/exit-app-button').click();

        cy.getTestElement('@suite-layout/body').should('be.visible');
        cy.getTestElement('@settings/menu/close').should('be.visible');
    });

    it('shows analytics consent and then goes to /accounts on initialized T1 device', () => {
        cy.task('startEmu', { version: '1-latest', wipe: true });
        cy.task('setupEmu', {
            needs_backup: false,
        });
        cy.prefixedVisit('/accounts');

        cy.getTestElement('@analytics/consent');
        cy.getTestElement('@onboarding/continue-button').click();
        cy.getTestElement('@onboarding/exit-app-button').click();

        cy.getTestElement('@suite-layout/body').should('be.visible');
        cy.getTestElement('@wallet/menu/wallet-send');
    });

    it('shows analytics consent and then goes to /accounts on initialized T2 device', () => {
        cy.task('startEmu', { wipe: true });
        cy.task('setupEmu', {
            needs_backup: false,
        });
        cy.prefixedVisit('/accounts');

        cy.getTestElement('@analytics/consent');
        cy.getTestElement('@onboarding/continue-button').click();
        cy.getTestElement('@onboarding/exit-app-button').click();

        cy.getTestElement('@suite-layout/body').should('be.visible');
        cy.getTestElement('@wallet/menu/wallet-send');
    });
});
