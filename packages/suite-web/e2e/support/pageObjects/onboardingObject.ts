/// <reference types="cypress" />

import { SeedType } from '../enums/seedType';

class OnboardingPage {
    waitForConfirmationOnDevice() {
        cy.getTestElement('@onboarding/confirm-on-device').should('be.visible');
    }

    createWallet() {
        cy.getTestElement('@onboarding/path-create-button').click();
    }

    selectSeedType(seedType: SeedType) {
        cy.getTestElement('@onboarding/select-seed-type-open-dialog').click();
        cy.getTestElement(`@onboarding/select-seed-type-${seedType}`).click();
        cy.getTestElement('@onboarding/select-seed-type-confirm').click();
    }

    createBackup() {
        cy.getTestElement('@onboarding/create-backup-button').click();
    }

    recoverWallet() {
        cy.getTestElement('@onboarding/path-recovery-button').click();
    }

    continueRecovery() {
        cy.getTestElement('@onboarding/recovery/continue-button').click();
    }

    continueCoins() {
        cy.getTestElement('@onboarding/coins/continue-button').click();
    }

    startRecovery() {
        cy.getTestElement('@onboarding/recovery/start-button').click();
    }

    retryRecovery() {
        cy.getTestElement('@onboarding/recovery/retry-button').click();
    }

    continueFirmware() {
        cy.getTestElement('@firmware/continue-button').click();
    }

    skipFirmware() {
        cy.getTestElement('@firmware/skip-button').click();
    }

    setPin() {
        cy.getTestElement('@onboarding/set-pin-button').click();
    }

    continuePin() {
        cy.getTestElement('@onboarding/pin/continue-button').should('be.visible').click();
    }

    skipPin() {
        cy.getTestElement('@onboarding/skip-button').click();
        cy.getTestElement('@onboarding/skip-button-confirm').click();
    }

    skipTutorial() {
        cy.getTestElement('@tutorial/skip-button').click();
        cy.getTestElement('@tutorial/continue-button').click();
    }

    checkOnboardingSuccess() {
        cy.getTestElement('@onboarding/final').should('be.visible').contains('Setup complete!');
    }
}

export const onOnboardingPage = new OnboardingPage();
