/* eslint-disable @typescript-eslint/naming-convention */

// @group:onboarding
// @retry=2

describe('Onboarding - create wallet', () => {
    beforeEach(() => {
        cy.task('startBridge');
        cy.viewport(1024, 768).resetDb();
        cy.prefixedVisit('/');
    });

    it('Success (Shamir capability)', () => {
        cy.task('startEmu', { version: Cypress.env('emuVersionT2'), wipe: true });
        cy.getTestElement('@onboarding/continue-button').click();
        cy.getTestElement('@onboarding/continue-button').click();
        cy.getTestElement('@firmware/continue-button').click();
        cy.getTestElement('@onboarding/path-create-button').click();

        cy.log('Performing standard backup');
        cy.getTestElement('@onboarding/button-standard-backup').click();
        cy.getTestElement('@onboarding/confirm-on-device').should('be.visible');
        cy.task('pressYes');

        cy.getTestElement('@onboarding/create-backup-button').click();

        cy.passThroughBackup();
        cy.getTestElement('@onboarding/set-pin-button').click();
        cy.getTestElement('@onboarding/confirm-on-device');

        cy.task('pressYes');
        cy.task('inputEmu', '1');
        cy.task('inputEmu', '1');
    });

    it('Success (Shamir backup)', () => {
        cy.task('startEmu', { version: '2.3.4', wipe: true });
        cy.getTestElement('@onboarding/continue-button').click();
        cy.getTestElement('@onboarding/continue-button').click();
        cy.getTestElement('@firmware/skip-button').click();
        cy.getTestElement('@onboarding/path-create-button').click();

        cy.log('Will be clicking on Shamir backup button');
        cy.getTestElement('@onboarding/shamir-backup-option-button').click();
        cy.getTestElement('@onboarding/confirm-on-device').should('be.visible');
        cy.task('pressYes');

        cy.getTestElement('@onboarding/create-backup-button').click();

        const shares = 3;
        const threshold = 2;
        cy.passThroughBackupShamir(shares, threshold);
        cy.getTestElement('@onboarding/set-pin-button').click();
        cy.getTestElement('@onboarding/confirm-on-device');

        cy.task('pressYes');
        cy.task('inputEmu', '12');
        cy.task('inputEmu', '12');
    });
});
