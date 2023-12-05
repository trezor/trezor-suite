// @group:settings
// @retry=2

describe('Language and theme detection', () => {
    beforeEach(() => {
        cy.viewport(1080, 1440).resetDb();
    });

    // TODO: [low prio] extend the test to work even when the user has dark settings
    it('Light English', () => {
        cy.prefixedVisit('/');
        cy.contains('Welcome').should('have.css', 'color', 'rgb(31, 31, 31)');
        cy.get('body').should('have.css', 'background-color', 'rgb(244, 244, 244)');
    });

    it('Dark Spanish', () => {
        cy.prefixedVisit('/', {
            onBeforeLoad(win) {
                cy.stub(win, 'matchMedia').callsFake(arg => ({
                    matches: arg === '(prefers-color-scheme: dark)',
                    addListener: () => {},
                    addEventListener: () => {},
                    removeEventListener: () => {},
                }));

                Object.defineProperty(win.navigator, 'languages', {
                    value: ['es-ES'],
                });
            },
        });
        cy.contains('¡Te damos la bienvenida!').should('have.css', 'color', 'rgb(234, 235, 237)');
        cy.get('body').should('have.css', 'background-color', 'rgb(24, 25, 26)');
    });
});

export {};
