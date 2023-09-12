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

/**
 * This function is to be used when a discovery might appear (eg. when enabling some networks) and we need to wait for its finish
 */
export const discoveryMightAppearAndShouldFinish = () => {
    cy.wait(1000); // after one second, discovery would have started if it was supposed to.
    cy.get('body').then($body => {
        if ($body.find('[data-test="@wallet/discovery-progress-bar"]').length > 0) {
            discoveryShouldFinish();
        }
    });
};
