// @group:metadata
// @retry=2

import { rerouteMetadataToMockProvider, stubOpen } from '../../stubs/metadata';

// fixture contains number of request that given provider needs go through this test scenario
const fixtures = [
    { provider: 'dropbox', numberOfRequests: [24, 25] },
    { provider: 'google', numberOfRequests: [10, 12] },
] as const;

describe(`Metadata is by default disabled, this means, that application does not try to generate master key and connect to cloud.
Hovering over fields that may be labeled shows "add label" button upon which is clicked, Suite initiates metadata flow`, () => {
    beforeEach(() => {
        cy.viewport(1024, 768).resetDb();
    });

    fixtures.forEach(f => {
        it(f.provider, () => {
            // prepare test
            cy.task('startEmu', { version: Cypress.env('emuVersionT2'), wipe: true });
            cy.task('setupEmu', {
                mnemonic: 'all all all all all all all all all all all all',
            });
            cy.task(`metadataStartProvider`, f.provider);
            cy.task('startBridge');

            cy.prefixedVisit('/', {
                onBeforeLoad: (win: Window) => {
                    cy.stub(win, 'open', stubOpen(win));
                    cy.stub(win, 'fetch', rerouteMetadataToMockProvider);
                },
            });

            cy.passThroughInitialRun();

            cy.discoveryShouldFinish();

            cy.getTestElement('@suite/menu/wallet-index').click();

            cy.log(
                'Default label is "Bitcoin #1". Clicking it in accounts menu is not possible. User can click on label in accounts sections. This triggers metadata flow',
            );
            cy.getTestElement('@account-menu/btc/normal/0/label').should('contain', 'Bitcoin');

            cy.getTestElement("@metadata/accountLabel/m/84'/0'/0'/add-label-button").click({
                force: true,
            });
            cy.passThroughInitMetadata(f.provider);

            cy.log('Edit and submit changes by pressing enter key');
            cy.getTestElement('@metadata/input').type(
                '{backspace}{backspace}{backspace}{backspace}{backspace}cool new label{enter}',
            );
            cy.getTestElement('@account-menu/btc/normal/0/label').should(
                'contain',
                'cool new label',
            );

            cy.log('Now edit and submit by clicking on submit button');
            cy.getTestElement("@metadata/accountLabel/m/84'/0'/0'").click();
            cy.getTestElement("@metadata/accountLabel/m/84'/0'/0'/edit-label-button").click({
                force: true,
            });
            cy.getTestElement('@metadata/input').type(' even cooler');
            cy.getTestElement('@metadata/submit').click();
            cy.getTestElement('@account-menu/btc/normal/0/label').should('contain', 'even cooler');
            cy.getTestElement("@metadata/accountLabel/m/84'/0'/0'/success").should('be.visible');
            cy.getTestElement("@metadata/accountLabel/m/84'/0'/0'/success").should('not.exist');

            cy.log('Now edit and press escape, should not save');
            cy.getTestElement("@metadata/accountLabel/m/84'/0'/0'").click();
            cy.getTestElement("@metadata/accountLabel/m/84'/0'/0'/edit-label-button").click({
                force: true,
            });
            cy.getTestElement('@metadata/input')
                .clear()
                .type('bcash is true bitcoin{esc}', { timeout: 20 });
            cy.getTestElement('@account-menu/btc/normal/0/label').should('contain', 'even cooler');

            cy.log('Check that accounts search reflects also metadata');
            cy.getTestElement('@account-menu/search-input').click().type('even cooler');
            cy.getTestElement('@account-menu/btc/normal/0').should('be.visible');
            cy.getTestElement('@account-menu/search-input').click().type('something retarded');
            cy.getTestElement('@account-menu/btc/normal/0').should('not.exist');
            cy.getTestElement('@account-menu/search-input').click().clear();

            cy.log('We can also remove metadata by clearing input');
            cy.getTestElement("@metadata/accountLabel/m/84'/0'/0'/edit-label-button").click({
                force: true,
            });
            cy.getTestElement('@metadata/input').clear().type('{enter}');

            cy.getTestElement('@account-menu/btc/normal/0/label').should('contain', 'Bitcoin');
            // check number of requests that were sent to metadata provider in the course of this scenario
            // - note if it fails:  data is not mocked, so it may fail if somebody adds an account to all seed
            //                      in future there should be mocked discovery
            //                      if it shoots somebody in leg, just remove this assertion...
            // - why asserting it:  just to make sure that metadata don't send unnecessary amount of request
            cy.wait(2000);
            cy.task('metadataGetRequests', { provider: f.provider }).then(requests => {
                expect(requests).to.have.length(f.numberOfRequests[0]);
            });

            // test switching between accounts. make sure that "success" button does not remain
            // visible when switching between accounts
            cy.getTestElement('@account-menu/segwit').click();
            cy.getTestElement('@account-menu/btc/segwit/0').click();
            cy.getTestElement("@metadata/accountLabel/m/49'/0'/0'/add-label-button").click({
                force: true,
            });
            cy.getTestElement('@metadata/input').type('typing into one input{enter}');
            cy.getTestElement("@metadata/accountLabel/m/49'/0'/0'/success").should('be.visible');
            cy.getTestElement('@account-menu/btc/segwit/1').click();
            cy.getTestElement("@metadata/accountLabel/m/49'/0'/1'/success").should('not.exist');
            cy.getTestElement("@metadata/accountLabel/m/49'/0'/0'/success").should('not.exist');

            // go to another route that triggers discovery and check whether there are any requests to metadata providers
            cy.getTestElement('@suite/menu/suite-index').click();
            cy.getTestElement('@dashboard/graph');
            // using wait is almost always anti-pattern but I guess we can live with it
            // problem is that cypress built in retry ability can't be used here when
            // retrieving number of requests from node.js
            cy.wait(2000);
            cy.getTestElement('@dashboard/graph');

            cy.task('metadataGetRequests', { provider: f.provider }).then(requests => {
                expect(requests).to.have.length(f.numberOfRequests[1]);
            });
        });
    });
});
