// @stable

import { stubFetch, stubOpen } from '../../stubs/metadata';

// what is tested here is probably covered in another metadata tests.
describe('Metadata', () => {
    beforeEach(() => {
        cy.viewport(1024, 768).resetDb();
    });
    after(() => {
        cy.task('stopGoogle');
    });

    it(`
        In settings, there is enable metadata switch. On enable, it initiates metadata right away (if device already has state).
        On disable, it throws away all metadata related records from memory.
    `, () => {
        // prepare test
        cy.task('startEmu', { wipe: true });
        cy.task('setupEmu');
        cy.task('startGoogle');

        cy.prefixedVisit('/accounts', { onBeforeLoad: (win: Window) => {
            cy.stub(win, 'open', stubOpen(win));
            cy.stub(win, 'fetch', stubFetch)
        }});


        cy.passThroughInitialRun();

        cy.log('Wait for discovery to finish. There is "add label" button, but no actual metadata appeared')
        // todo: better waiting for discovery (mock it!)
        cy.getTestElement('@wallet/loading-other-accounts', { timeout: 30000 });
        cy.getTestElement('@wallet/loading-other-accounts', { timeout: 30000 }).should('not.be.visible');
        cy.getTestElement('@account-menu/btc/normal/0/label').should('contain', 'Bitcoin');

        cy.log('Go to settings and enable metadata');
        cy.getTestElement('@suite/menu/settings-index').click();
        cy.getTestElement('@settings/metadata-switch').click({ force: true });
        cy.passThroughInitMetadata();
        
        cy.log('Now metadata is enabled, go to accounts');
        cy.getTestElement('@suite/menu/wallet-index').click();
        cy.getTestElement('@account-menu/btc/normal/0/label').should('contain', 'label');

        cy.log("Now go back to settings, disable metadata and check that we don't see them in app");

        cy.getTestElement('@suite/menu/settings-index').click();
        cy.getTestElement('@settings/metadata-switch').click({ force: true });
        cy.getTestElement('@suite/menu/wallet-index').click();
        cy.getTestElement('@account-menu/btc/normal/0/label').should('not.contain', 'label');
    });
});
