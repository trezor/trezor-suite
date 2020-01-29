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
