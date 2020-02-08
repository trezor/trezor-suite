/**
 * Shortcut to click device menu
 */
export const toggleDeviceMenu = () => {
    return cy.getTestElement('@suite/device_selection').click();
};

export const goToOnboarding = () => {
    return cy
        .getTestElement('@button/continue')
        .click()
        .getTestElement('@button/go-to-onboarding')
        .click();
};

export const passThroughInitialRun = () => {
    return cy
        .getTestElement('@button/continue')
        .click()
        .getTestElement('@button/go-to-onboarding')
        .click()
        .getTestElement('@onboarding/button-skip')
        .click()
        .getTestElement('@onboarding/button-skip')
        .click();
};

export const passThroughBackup = () => {
    cy.log('Backup button should be disabled until all checkboxes are checked');
    cy.getTestElement('@backup/start-button').should('be.disabled');
    cy.getTestElement('@backup/check-item/understands-what-seed-is').click();
    cy.getTestElement('@backup/start-button').should('be.disabled');
    cy.getTestElement('@backup/check-item/has-enough-time').click();
    cy.getTestElement('@backup/start-button').should('be.disabled');
    cy.getTestElement('@backup/check-item/is-in-private').click();
    cy.getTestElement('@backup/start-button').should('not.be.disabled');

    cy.log('Create backup on device');
    cy.getTestElement('@backup/start-button').click();
    cy.getConfirmActionOnDeviceModal();
    cy.task('sendDecision');
    cy.task('readAndConfirmMnemonicEmu');

    cy.log('click all after checkboxes and close backup modal');
    cy.getTestElement('@backup/close-button').should('be.disabled');
    cy.getTestElement('@backup/check-item/wrote-seed-properly').click();
    cy.getTestElement('@backup/check-item/made-no-digital-copy').click();
    cy.getTestElement('@backup/check-item/will-hide-seed').click();
    cy.getTestElement('@backup/close-button').click();
}