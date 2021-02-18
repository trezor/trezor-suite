// @group:suite
// @retry=2
import { version } from '../../../../../../package.json';

describe('There is a hidden route (not accessible in UI)', () => {
    beforeEach(() => {
        cy.viewport(1024, 768).resetDb();
    });

    it('/version', () => {
        cy.prefixedVisit('/version');
        cy.getTestElement('@version/number').should('contain', version);
        cy.getTestElement('@version').matchImageSnapshot({
            blackout: ['[data-test="@version/commit-hash-link"]'],
        });
    });
});
