// todo: finish when we have emulator
// const pagesThatNeedDevice = ['/bridge', '/onboarding', '/settings', '/wallet'];

describe('Pages', () => {
    beforeEach(() => {
        cy.viewport(1024, 768).visit('/');
    });

    it(`test / page is online`, () => {
        cy.visit('/')
            .get('html')
            .should('contain', 'Connect Trezor to continue');
    });

    it(`test /version page is online`, () => {
        cy.visit('/version')
            .get('html')
            .should('contain', 'version');
    });

    // todo: 404 also requires device now
    // it('should render a nice 404 page', () => {
    //     cy.visit('/bcash-is-the-best-lol').matchImageSnapshot();
    // });
});
