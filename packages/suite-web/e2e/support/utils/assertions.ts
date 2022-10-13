/**
 * Use this method to ensure that app is in the first step of onboarding and
 * ready to interact with
 */
export const onboardingShouldLoad = () =>
    cy.getTestElement('@onboarding/welcome-step').should('be.visible');

export const dashboardShouldLoad = () => cy.getTestElement('@dashboard/index').should('be.visible');

export const discoveryShouldFinish = () => {
    // todo: better waiting for discovery (mock it!)
    cy.getTestElement('@wallet/discovery-progress-bar', { timeout: 30000 });
    cy.getTestElement('@wallet/discovery-progress-bar', { timeout: 30000 }).should('not.exist');
};
