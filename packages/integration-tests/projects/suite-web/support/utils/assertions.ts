/**
 * Use this method to ensure that app is in the first step of onboarding and
 * ready to interact with
 */
export const onboardingShouldLoad = () => {
    return cy.get('html').should('contain', 'Welcome to Trezor');
};

export const dashboardShouldLoad = () => {
    return cy.getTestElement('@dashboard/index').should('be.visible');
};
