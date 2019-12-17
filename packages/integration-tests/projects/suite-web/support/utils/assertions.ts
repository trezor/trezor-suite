/**
 * Use this method to ensure that app is in the first step of onboarding and
 * ready to interact with
 */
export const onboardingShouldLoad = () => {
    return cy.get('html').should('contain', 'Welcome to Trezor');
};

export const walletShouldLoad = () => {
    return cy.get('html').should('contain', 'Dashboard');
};
