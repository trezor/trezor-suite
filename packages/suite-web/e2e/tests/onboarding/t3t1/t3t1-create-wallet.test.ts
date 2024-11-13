// @group_device-management
// @retry=2

import { SeedType } from '../../../support/enums/seedType';
import { onAnalyticsPage } from '../../../support/pageObjects/analyticsObject';
import { onOnboardingPage } from '../../../support/pageObjects/onboardingObject';
import { getConfirmActionOnDeviceModal } from '../../../support/utils/selectors';

function acceptTos(): void {
    onOnboardingPage.waitForConfirmationOnDevice();
    cy.task('pressYes');
}

function confirmWalletCreated(): void {
    onOnboardingPage.waitForConfirmationOnDevice();
    cy.task('pressYes');
}

describe('Onboarding - create wallet', () => {
    beforeEach(() => {
        cy.task('startBridge');
        cy.viewport('macbook-13').resetDb();
        cy.prefixedVisit('/');
        cy.disableFirmwareHashCheck();
        cy.task('startEmu', { wipe: true, model: 'T3T1', version: '2-latest' });

        cy.step('Go through analytics', () => {
            onAnalyticsPage.continue();
            onAnalyticsPage.continue();
        });
    });

    it('Success (Shamir backup)', () => {
        cy.step('Go through Device onboarding step', () => {
            onOnboardingPage.skipFirmware();
            cy.passThroughAuthenticityCheck();

            cy.wait(500);
            onOnboardingPage.skipTutorial();
        });

        cy.step('Create wallet with shamir backup', () => {
            onOnboardingPage.createWallet();
            onOnboardingPage.selectSeedType(SeedType.Advanced);

            acceptTos();
            confirmWalletCreated();

            onOnboardingPage.createBackup();

            const shares = 3;
            const threshold = 2;
            cy.passThroughBackupShamir(shares, threshold);
        });

        cy.step('Set pin', () => {
            onOnboardingPage.setPin();
            onOnboardingPage.waitForConfirmationOnDevice();
            cy.task('pressYes');
            cy.task('inputEmu', '12');
            cy.task('inputEmu', '12');

            getConfirmActionOnDeviceModal();
            cy.task('pressYes');

            onOnboardingPage.continuePin();
        });
    });
});
