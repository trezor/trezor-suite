import sections from '../../src/js/data/menu';

describe('Methods', () => {
    beforeEach(() => {
        cy.viewport(1024, 768).visit('/');
    });

    sections.forEach(section => {
        describe(section.name, () => {
            section.children.forEach(child => {
                // lazy do create recursive, just tinkering around now, dont judge code very much.
                if (child.children) {
                    describe(child.name, () => {
                        child.children.forEach(grandChild => {
                            const url = `/#${grandChild.url}`;
                            it(`${grandChild.name} url:${url}`, () => {
                                cy.visit(url)
                                    .get('html')
                                    .should('be.visible')
                                    .should('contain', grandChild.name)
                                    // .getTestElement('method-submit-button')
                                    // .click();
                                    .matchImageSnapshot();
                            });
                        });
                    });
                } else {
                    const url = `/#${child.url}`;
                    it(`${child.name} url: ${url}`, () => {
                        cy.visit(url)
                            .get('html')
                            .should('be.visible')
                            .should('contain', child.name)
                            .matchImageSnapshot();
                    });
                }
            });
        });
    });
});
