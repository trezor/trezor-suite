// @group_settings
// @retry=2

describe('Language and theme detection', () => {
    beforeEach(() => {
        cy.viewport(1440, 2560).resetDb();
    });

    // TODO: [low prio] extend the test to work even when the user has dark settings
    it('Light English', () => {
        cy.prefixedVisit('/');
        cy.contains('Welcome').should('have.css', 'color', 'rgb(255, 255, 255)');
        cy.get('body').should('have.css', 'background-color', 'rgb(22, 22, 22)');
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
        cy.contains('Welcome').should('have.css', 'color', 'rgb(255, 255, 255)');
        cy.get('body').should('have.css', 'background-color', 'rgb(22, 22, 22)');
    });
});

export {};
