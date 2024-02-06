// @group:suite
// @retry=2
import { getSuiteVersion } from '@trezor/env-utils';

describe('There is a hidden route (not accessible in UI)', () => {
    beforeEach(() => {
        cy.viewport(1440, 2560).resetDb();
    });

    it('/version', () => {
        const suiteVersion = getSuiteVersion();

        cy.prefixedVisit('/version');
        cy.getTestElement('@version/number').should('contain', suiteVersion);
        cy.getTestElement('@modal/version').screenshot('version-modal');
    });
});

export {};
