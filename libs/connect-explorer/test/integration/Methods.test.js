import sections from '../../src/js/data/menu';

const testMethodContent = (cy, section) => {
    const url = `/#${section.url}`;
    it(`${section.name} url: ${url}`, () => {
        cy.visit(url)
            .get('html')
            // .get('.method-content')
            .should('be.visible')
            .should('contain', section.name)
            .matchImageSnapshot({
                blackout: ['.infinity-menu-container'],
            });
    });
};

describe('Methods', () => {
    beforeEach(() => {
        cy.viewport(1024, 768).visit('/');
    });

    sections.forEach(section => {
        describe(section.name, () => {
            section.children.forEach(child => {
                if (child.children) {
                    describe(child.name, () => {
                        child.children.forEach(grandChild => {
                            testMethodContent(cy, grandChild);
                        });
                    });
                } else {
                    testMethodContent(cy, child);
                }
            });
        });
    });
});
