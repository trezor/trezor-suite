// @stable

import { stubFetch, stubOpen } from '../../stubs/metadata';

describe('Metadata', () => {
    beforeEach(() => {
        cy.viewport(1024, 768).resetDb();
    });
    after(() => {
        cy.task('stopGoogle');
    });

    it('Token expires', () => {
        cy.task('startEmu', { wipe: true });
        cy.task('setupEmu');
        cy.task('startGoogle');

        cy.prefixedVisit('/settings', { onBeforeLoad: (win: Window) => {
            cy.stub(win, 'open', stubOpen(win));
            cy.stub(win, 'fetch', stubFetch);

        }});

        cy.passThroughInitialRun();

        cy.getTestElement('@settings/metadata-switch').click({ force: true });
        cy.log('interesting is that init metadata flow does not start, it is because device is not authorized')

        cy.getTestElement('@suite/menu/wallet-index').click();
        cy.task('pressYes');
        cy.getTestElement('@modal/metadata-provider/google-button').click();
        cy.getTestElement('@modal/metadata-provider').should('not.exist');

        // todo: wait for discovery to finish and remove this
        cy.getTestElement('@wallet/loading-other-accounts', { timeout: 30000 });
        cy.getTestElement('@wallet/loading-other-accounts', { timeout: 30000 }).should('not.be.visible');
            
        cy.log('at this moment, oauth token expires');
        cy.getTestElement('@account-menu/btc/normal/0/add-label-button').click();
        cy.getTestElement('@modal/add-metadata/input').type('Kvooo');
        cy.task('setupGoogle', { prop: 'user', value: null });

        cy.getTestElement('@modal/add-metadata/submit-button').click();
        cy.get('body').should('contain.text', 'Failed to sync data with cloud provider');

    })

});
