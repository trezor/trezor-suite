// todo: finish when we have emulator
// const pagesThatNeedDevice = ['/bridge', '/onboarding', '/settings', '/wallet'];

describe('Pages', () => {
    it(`test / page is online in initial run`, () => {
        cy.viewport(1024, 768)
            .visit('/', {
                onBeforeLoad: win => {
                    win.initialState = {
                        suite: {
                            initialRun: true,
                        },
                    };
                },
            })
            .location('pathname')
            .should('match', /onboarding/);
    });

    // it(`test / page is online after initial run`, () => {
    //     cy.viewport(1024, 768)
    //         .visit('/', {
    //             onBeforeLoad: win => {
    //                 win.initialState = {
    //                     suite: {
    //                         initialRun: false,
    //                     },
    //                 };
    //             },
    //         })
    //         .get('html')
    //         .should('contain', 'Connect Trezor to continue');
    // });

    // it(`test /version page is online`, () => {
    //     cy.viewport(1024, 768)
    //         .visit('/version')
    //         .get('html')
    //         .should('contain', 'version');
    // });

    // todo: 404 also requires device now
    // it('should render a nice 404 page', () => {
    //     cy.visit('/bcash-is-the-best-lol').matchImageSnapshot();
    // });
});
