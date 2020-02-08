// import { NETWORKS } from '@wallet-config';

describe('Discovery', () => {
    before(() => {
        cy.task('startEmu');
        cy.task('setupEmu');
        cy.viewport(1024, 768).resetDb();
    });

    it('navigate to wallet settings page', () => {
        cy.visit('/');
        cy.passThroughInitialRun();
        cy.getTestElement('@suite/menu/settings').click({ force: true });
        cy.getTestElement('@suite/settings/menu/wallet').click({ force: true });
        cy.get('[data-test="@settings/wallet/coins-group"] [role="switch"]').click({
            multiple: true,
            force: true,
        });

        // todo: just loading dashboard now, need to add assertions;
        cy.getTestElement('@suite/menu/suite-index').click();
    });
});
