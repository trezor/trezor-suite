describe('Static pages', () => {
    beforeEach(() => {
        cy.viewport(1024, 768);
    });

    // it(`test / page is online in initial run`, () => {
    //     cy.viewport(1024, 768)
    //         .visit('/', {
    //             onBeforeLoad: win => {
    //                 win.initialState = {
    //                     suite: {
    //                         initialRun: true,
    //                     },
    //                 };
    //             },
    //         })
    //         .location('pathname')
    //         .should('match', /onboarding/);
    // });

    it(`test /bridge page is online`, () => {
        cy.visit('/bridge')
            .get('html')
            .should('contain', 'bridge');
    });

    it(`test /version page is online`, () => {
        cy.visit('/version')
            .get('html')
            .should('contain', 'version');
    });

    it(`test /onboarding page is online`, () => {
        cy.visit('/onboarding')
            .get('html')
            .should('contain', 'Welcome to Trezor');
    });

    // todo: test 404 page. (not so easy)
});
