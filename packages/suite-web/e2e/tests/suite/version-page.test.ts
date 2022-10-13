// @group:suite
// @retry=2
import { suiteVersion } from '../../../../suite/package.json';

describe('There is a hidden route (not accessible in UI)', () => {
    beforeEach(() => {
        cy.viewport(1080, 1440).resetDb();
    });

    it('/version', () => {
        cy.prefixedVisit('/version');
        cy.getTestElement('@version/number').should('contain', suiteVersion);
        cy.getTestElement('@modal/version').screenshot('version-modal');
    });
});
