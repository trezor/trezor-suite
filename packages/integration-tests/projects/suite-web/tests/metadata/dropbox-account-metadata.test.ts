// @group:metadata
// @retry=2

import { rerouteDropbox, stubOpen } from '../../stubs/metadata';

describe('Metadata', () => {
    beforeEach(() => {
        cy.viewport(1024, 768).resetDb();
    });

    after(() => {
        cy.task('stopDropbox');
    });

    it(`
        Metadata is by default disabled, this means, that application does not try to generate master key and connect to cloud.
        Hovering on some fields that may be labeled shows "add label" button upon which is clicked, Suite initiates metadata flow
        `, () => {
        // prepare test
        cy.task('startEmu', { wipe: true });
        cy.task('setupEmu');
        cy.task('startDropbox');

        cy.prefixedVisit('/accounts', {
            onBeforeLoad: (win: Window) => {
                cy.stub(win, 'open', stubOpen(win));
                cy.stub(win, 'fetch', rerouteDropbox);
            },
        });

        cy.passThroughInitialRun();

        // todo: better waiting for discovery (mock it!)
        cy.getTestElement('@wallet/loading-other-accounts', { timeout: 30000 });
        cy.getTestElement('@wallet/loading-other-accounts', { timeout: 30000 }).should(
            'not.be.visible',
        );

        cy.log(
            'Default label is "Bitcoin #1". Clicking it in accounts menu is not possible. User can click on label in accounts sections. This triggers metadata flow',
        );
        cy.getTestElement('@account-menu/btc/normal/0/label').should('contain', 'Bitcoin');

        cy.getTestElement("@metadata/accountLabel/m/84'/0'/0'/add-label-button").click({
            force: true,
        });
        cy.passThroughInitMetadata('dropbox');

        cy.log('Edit and submit changes by pressing enter key');
        cy.getTestElement('@metadata/input').type(
            '{backspace}{backspace}{backspace}{backspace}{backspace}cool new label{enter}',
        );
        cy.getTestElement('@account-menu/btc/normal/0/label').should('contain', 'cool new label');

        cy.log('Now edit and submit by clicking on submit button');
        cy.getTestElement("@metadata/accountLabel/m/84'/0'/0'").click();
        cy.getTestElement("@metadata/accountLabel/m/84'/0'/0'/edit-label-button").click({
            force: true,
        });
        cy.getTestElement('@metadata/input').type(' even cooler');
        cy.getTestElement('@metadata/submit').click();
        cy.getTestElement('@account-menu/btc/normal/0/label').should(
            'contain',
            'cool new label even cooler',
        );

        cy.log('Now edit and press escape, should not save');
        cy.getTestElement("@metadata/accountLabel/m/84'/0'/0'").click();
        cy.getTestElement("@metadata/accountLabel/m/84'/0'/0'/edit-label-button").click({
            force: true,
        });
        cy.getTestElement('@metadata/input')
            .clear()
            .type('bcash is true bitcoin{esc}', { timeout: 20 });
        cy.getTestElement('@account-menu/btc/normal/0/label').should(
            'contain',
            'cool new label even cooler',
        );

        cy.log('Check that accounts search reflects also metadata');
        cy.getTestElement('@account-menu/search-input').click().type('cool new label');
        cy.getTestElement('@account-menu/btc/normal/0').should('be.visible');
        cy.getTestElement('@account-menu/search-input').click().type('something retarded');
        cy.getTestElement('@account-menu/btc/normal/0').should('not.be.visible');
        cy.getTestElement('@account-menu/search-input').click().clear();

        cy.log('We can also remove metadata by clearing input');
        cy.getTestElement("@metadata/accountLabel/m/84'/0'/0'/edit-label-button").click({
            force: true,
        });
        cy.getTestElement('@metadata/input').clear().type('{enter}');

        // check number of requests that were sent to dropbox in the course of this scenario
        // - note if it fails:  data is not mocked, so it may fail if somebody adds an account to all seed
        //                      in future there should be mocked discovery
        //                      if it shoots somebody in leg, just remove this assertion...
        // - why asserting it:  just to make sure that metadata don't send unnecessary amount of request
        cy.task('getRequests', { provider: 'dropbox' }).then(requests => {
            expect(requests).to.have.length(24);
        });

        cy.getTestElement('@account-menu/btc/normal/0/label').should('contain', 'Bitcoin');
    });
});
