// @stable/metadata

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

        cy.prefixedVisit('/accounts', {
            onBeforeLoad: (win: Window) => {
                cy.stub(win, 'open', stubOpen(win));
                cy.stub(win, 'fetch', stubFetch);
            },
        });

        cy.passThroughInitialRun();

        // todo: wait for discovery to finish and remove this
        cy.getTestElement('@wallet/loading-other-accounts', { timeout: 30000 });
        cy.getTestElement('@wallet/loading-other-accounts', { timeout: 30000 }).should(
            'not.be.visible',
        );

        cy.getTestElement('@suite/menu/settings-index').click();
        cy.getTestElement('@settings/metadata-switch').click({ force: true });

        cy.passThroughInitMetadata();

        cy.getTestElement('@suite/menu/wallet-index').click();

        cy.getTestElement("@metadata/accountLabel/m/84'/0'/0'").click({ force: true });
        cy.getTestElement("@metadata/edit-button").click({ force: true });

        cy.log('at this moment, oauth token expires');
        cy.task('setupGoogle', { prop: 'user', value: null });

        cy.getTestElement('@metadata/input').type('Kvooo{enter}');

        cy.getTestElement('@toast').should('contain.text', 'Failed to sync labeling data with cloud provider');
    });
});

