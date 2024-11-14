// @group_device-management
// @retry=2

import { onOnboardingPage } from '../../../support/pageObjects/onboardingObject';
import { onWordInputPage } from '../../../support/pageObjects/wordInputObject';
import { onAnalyticsPage } from '../../../support/pageObjects/analyticsObject';
import { onRecoverPage } from '../../../support/pageObjects/recoverObject';

const mnemonic = [
    'nasty',
    'answer',
    'gentle',
    'inform',
    'unaware',
    'abandon',
    'regret',
    'supreme',
    'dragon',
    'gravity',
    'behind',
    'lava',
    'dose',
    'pilot',
    'garden',
    'into',
    'dynamic',
    'outer',
    'hard',
    'speed',
    'luxury',
    'run',
    'truly',
    'armed',
];

describe('Onboarding - recover wallet T1B1', () => {
    beforeEach(() => {
        cy.task('startBridge');
        cy.task('startEmu', { model: 'T1B1', version: '1-latest', wipe: true });
        cy.viewport('macbook-13').resetDb();
        cy.prefixedVisit('/');
        cy.disableFirmwareHashCheck();

        cy.step('Go through analytics', () => {
            onAnalyticsPage.continue();
            onAnalyticsPage.continue();
        });
    });

    it('Successfully recovers wallet from mnemonic', () => {
        cy.step('Start wallet recovery process and confirm on device', () => {
            onOnboardingPage.continueFirmware();
            onOnboardingPage.recoverWallet();
            onRecoverPage.selectWordCount(24);
            onRecoverPage.selectBasicRecovery();
            onOnboardingPage.waitForConfirmationOnDevice();
            cy.wait(2000);
            cy.task('pressYes');
        });

        onWordInputPage.inputMnemonicT1B1(mnemonic);

        cy.step('Finalize recovery, skip pin and check success', () => {
            onOnboardingPage.continueRecovery();
            onOnboardingPage.skipPin();
            onOnboardingPage.continueCoins();
            onOnboardingPage.checkOnboardingSuccess();
        });
    });
});
