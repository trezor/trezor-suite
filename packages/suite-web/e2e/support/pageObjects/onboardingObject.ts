/// <reference types="cypress" />

class OnboardingPage {
    waitForConfirmationOnDevice() {
        cy.getTestElement('@onboarding/confirm-on-device').should('be.visible');
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

    continueFirmware() {
        cy.getTestElement('@firmware/continue-button').click();
    }

    startRecovery() {
        cy.getTestElement('@onboarding/recovery/start-button').click();
    }

    retryRecovery() {
        cy.getTestElement('@onboarding/recovery/retry-button').click();
    }

    skipFirmware() {
        cy.getTestElement('@firmware/skip-button').click();
    }

    skipPin() {
        cy.getTestElement('@onboarding/skip-button').click();
        cy.getTestElement('@onboarding/skip-button-confirm').click();
    }

    checkOnboardingSuccess() {
        cy.getTestElement('@onboarding/final').should('be.visible').contains('Setup complete!');
    }
}

export const onOnboardingPage = new OnboardingPage();
