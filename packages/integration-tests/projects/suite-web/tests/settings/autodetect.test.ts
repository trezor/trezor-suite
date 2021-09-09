// @group:settings
// @retry=2

describe('Language and theme detection', () => {
    beforeEach(() => {
        cy.viewport(1024, 768).resetDb();
    });

    it('Light English', () => {
        cy.prefixedVisit('/');
        cy.contains('Welcome').should('have.css', 'color', 'rgb(64, 64, 64)');
        cy.get('body').should('have.css', 'background-color', 'rgb(244, 244, 244)');
    });

    it('Dark Spanish', () => {
        cy.prefixedVisit('/', {
            onBeforeLoad(win) {
                cy.stub(win, 'matchMedia')
                    .withArgs('(prefers-color-scheme: dark)')
                    .returns({
                        matches: true,
                        addEventListener: () => {},
                        removeEventListener: () => {},
                    });
                Object.defineProperty(win.navigator, 'languages', {
                    value: ['es-ES'],
                });
            },
        });
        cy.contains('Bienvenido/a').should('have.css', 'color', 'rgb(234, 235, 237)');
        cy.get('body').should('have.css', 'background-color', 'rgb(24, 25, 26)');
    });
});
