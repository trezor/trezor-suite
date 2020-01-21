/**
 * Shortcut to click device menu
 */
export const toggleDeviceMenu = () => {
    return cy.getTestElement('@suite/device_selection').click();
};

export const goToOnboarding = () => {
    return cy.getTestElement('@button/go-to-onboarding').click();
}

export const goToSuite = () => {
    return cy.getTestElement('@suite/welcome/go-to-suite').click()
}