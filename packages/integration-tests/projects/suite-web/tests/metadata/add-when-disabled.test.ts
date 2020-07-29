// @stable

import { stubFetch, stubOpen } from '../../stubs/metadata';

describe('Metadata', () => {
    beforeEach(() => {
        cy.viewport(1024, 768).resetDb();
    });
    
    after(() => {
        cy.task('stopGoogle');
    });

    it(`
        Metadata is by default disabled, this means, that application does not try to generate master key and connect to cloud.
        - "add metadata" labels are still present and clicking on them enables metadata
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
            
            // todo: wait for discovery to finish and remove this
            cy.getTestElement('@wallet/loading-other-accounts', { timeout: 30000 });
            cy.getTestElement('@wallet/loading-other-accounts', { timeout: 30000 }).should('not.be.visible');
    
            cy.log('Default label is "Bitcoin #1". Clicking on add label button triggers metadata flow');
            cy.getTestElement('@account-menu/btc/normal/0/label').should('contain', 'Bitcoin');
            cy.getTestElement('@account-menu/btc/normal/0/add-label-button').click();
            cy.task('pressYes');
            cy.getTestElement('@modal/metadata-provider/google-button').click();
            cy.getTestElement('@modal/metadata-provider').should('not.exist');

            cy.log("Before input becomes available to user, metadata is synced, so if there is already record for this account, it will be pre filled in the input");
            cy.getTestElement('@modal/add-metadata/input').should('have.value', 'label');
            cy.getTestElement('@modal/add-metadata/input').type('{backspace}{backspace}{backspace}{backspace}{backspace}My cool label for account');
            cy.getTestElement('@modal/add-metadata/submit-button').click();
            cy.getTestElement('@account-menu/btc/normal/0/label').should('contain', 'My cool label for account');
    });
});
