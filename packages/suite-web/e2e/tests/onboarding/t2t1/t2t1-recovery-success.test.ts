// @group_device-management
// @retry=2

import { onAnalyticsPage } from '../../../support/pageObjects/analyticsObject';
import { onOnboardingPage } from '../../../support/pageObjects/onboardingObject';

describe('Onboarding - recover wallet T2T1', () => {
    beforeEach(() => {
        cy.task('startBridge');
        cy.task('startEmu', { wipe: true, model: 'T2T1', version: '2.5.3' });
        cy.viewport('macbook-13').resetDb();
        cy.prefixedVisit('/');

        cy.step('Go through analytics', () => {
            onAnalyticsPage.continue();
            onAnalyticsPage.continue();
        });
    });

    it('Successfully recovers wallet from mnemonic', () => {
        cy.step('Start wallet recovery process and confirm on device', () => {
            onOnboardingPage.skipFirmware();
            onOnboardingPage.recoverWallet();
            onOnboardingPage.startRecovery();

            onOnboardingPage.waitForConfirmationOnDevice();
            cy.wait(1000);
            cy.task('pressYes');

            onOnboardingPage.waitForConfirmationOnDevice();
            cy.wait(1000);
            cy.task('pressYes');

            cy.wait(1000);
            cy.task('selectNumOfWordsEmu', 12);

            cy.wait(1000);
            cy.task('pressYes');
        });

        cy.step('Input mnemonic', () => {
            cy.wait(1000);
            for (let i = 0; i < 12; i++) {
                cy.task('inputEmu', 'all');
            }
        });

        cy.step('Confirm recovery success', () => {
            cy.wait(1000);
            cy.task('pressYes');
        });

        cy.step('Finalize recovery, skip pin and check success', () => {
            onOnboardingPage.continueRecovery();
            onOnboardingPage.skipPin();
            onOnboardingPage.continueCoins();
            onOnboardingPage.checkOnboardingSuccess();
        });
    });
});
