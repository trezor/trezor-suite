describe('Notifications', () => {
    beforeEach(() => {
        cy.viewport(1024, 768);
    });

    [
        'notification-success',
        'notification-cta-success',
        'notification-second-cta-success',
        'notification-loading-success',
        'notification-desc-success',
        'notification-desc-cta-success',
        'notification-desc-second-cta-success',
        'notification-desc-loading-success',
        'notification-info',
        'notification-cta-info',
        'notification-second-cta-info',
        'notification-loading-info',
        'notification-desc-info',
        'notification-desc-cta-info',
        'notification-desc-second-cta-info',
        'notification-desc-loading-info',
        'notification-warning',
        'notification-cta-warning',
        'notification-second-cta-warning',
        'notification-loading-warning',
        'notification-desc-warning',
        'notification-desc-cta-warning',
        'notification-desc-second-cta-warning',
        'notification-desc-loading-warning',
        'notification-error',
        'notification-cta-error',
        'notification-second-cta-error',
        'notification-loading-error',
        'notification-desc-error',
        'notification-desc-cta-error',
        'notification-desc-second-cta-error',
        'notification-desc-loading-error',
    ].forEach(testName => {
        it(`${testName}`, () => {
            cy.loadContent('/iframe.html?selectedKind=Notifications&selectedStory=All&full=0');
            cy.getTestElement(testName).should('be.visible').matchImageSnapshot();
        });
    });
});
