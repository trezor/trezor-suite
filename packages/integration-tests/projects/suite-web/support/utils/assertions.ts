/**
 * Use this method to ensure that app is in the first step of onboarding and
 * ready to interact with
 */
export const onboardingShouldLoad = () => {
    return cy.getTestElement('@onboarding/welcome-step').should('be.visible');
};

export const dashboardShouldLoad = () => {
    return cy.getTestElement('@dashboard/index').should('be.visible');
};
