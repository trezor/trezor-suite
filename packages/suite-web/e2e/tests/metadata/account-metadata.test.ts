// @group:metadata
// @retry=2

import { rerouteMetadataToMockProvider, stubOpen } from '../../stubs/metadata';

// fixture contains number of request that given provider needs go through this test scenario
const fixtures = [
    {
        provider: 'dropbox',
        numberOfRequests: {
            '2-main': [25, 27],
            legacy: [25, 26],
        },
    },
    {
        provider: 'google',
        numberOfRequests: {
            '2-main': [9, 12],
            legacy: [9, 12],
        },
    },
] as const;

describe(`Metadata is by default disabled, this means, that application does not try to generate master key and connect to cloud.
Hovering over fields that may be labeled shows "add label" button upon which is clicked, Suite initiates metadata flow`, () => {
    beforeEach(() => {
        cy.viewport(1080, 1440).resetDb();
    });

    fixtures.forEach(f => {
        it(f.provider, () => {
            // prepare test
            cy.task('startEmu', { wipe: true });
            cy.task('setupEmu', {
                mnemonic: 'all all all all all all all all all all all all',
            });
            cy.task(`metadataStartProvider`, f.provider);

            cy.prefixedVisit('/', {
                onBeforeLoad: (win: Window) => {
                    cy.stub(win, 'open').callsFake(stubOpen(win));
                    cy.stub(win, 'fetch').callsFake(rerouteMetadataToMockProvider);
                },
            });

            cy.getTestElement('@analytics/continue-button');
            cy.task('startBridge');

            cy.passThroughInitialRun();

            cy.discoveryShouldFinish();

            cy.getTestElement('@account-menu/btc/normal/0').click();

            cy.log(
                'Default label is "Bitcoin #1". Clicking it in accounts menu is not possible. User can click on label in accounts sections. This triggers metadata flow',
            );
            cy.getTestElement('@account-menu/btc/normal/0/label').should('contain', 'Bitcoin');

            cy.hoverTestElement("@metadata/accountLabel/m/84'/0'/0'/hover-container");
            cy.getTestElement("@metadata/accountLabel/m/84'/0'/0'/add-label-button")
                .should('be.visible')
                .click();

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
            cy.wait(50);
            cy.getTestElement("@metadata/accountLabel/m/84'/0'/0'/edit-label-button").click();
            cy.getTestElement('@metadata/input').type(' even cooler');
            cy.getTestElement('@metadata/submit').click();
            cy.getTestElement('@account-menu/btc/normal/0/label').should('contain', 'even cooler');
            cy.getTestElement("@metadata/accountLabel/m/84'/0'/0'/success").should('be.visible');
            cy.getTestElement("@metadata/accountLabel/m/84'/0'/0'/success").should('not.exist');

            cy.log('Now edit and press escape, should not save');
            cy.getTestElement("@metadata/accountLabel/m/84'/0'/0'").click();
            cy.getTestElement("@metadata/accountLabel/m/84'/0'/0'/edit-label-button").click();
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
            cy.wait(50);
            cy.getTestElement("@metadata/accountLabel/m/84'/0'/0'/edit-label-button").click();
            cy.getTestElement('@metadata/input').clear().type('{enter}');

            cy.getTestElement('@account-menu/btc/normal/0/label').should('contain', 'Bitcoin');
            // check number of requests that were sent to metadata provider in the course of this scenario
            // - note if it fails:  data is not mocked, so it may fail if somebody adds an account to all seed
            //                      in future there should be mocked discovery
            //                      if it shoots somebody in leg, just remove this assertion...
            // - why asserting it:  just to make sure that metadata don't send unnecessary amount of request

            // todo: this assertion is flaky. turning it off for now
            // cy.waitUntil command is part of cypress-wait-until library which was already removed from the project
            //
            // cy.waitUntil(() =>
            //     cy.task('metadataGetRequests', { provider: f.provider }).then(requests => {
            //         const expectedNumberOfRequests =
            //             f.numberOfRequests[startEmuParams.version] ?? f.numberOfRequests.legacy;
            //         cy.log(
            //             `requests.length ${requests.length} of expected ${expectedNumberOfRequests[0]}`,
            //         );
            //         expect(requests.length).equal(expectedNumberOfRequests[0]);
            //     }),
            // );

            // test switching between accounts. make sure that "success" button does not remain
            // visible when switching between accounts
            cy.getTestElement('@account-menu/segwit').click();
            cy.getTestElement('@account-menu/btc/segwit/0').click();
            cy.getTestElement("@metadata/accountLabel/m/49'/0'/0'/add-label-button").click();
            cy.getTestElement('@metadata/input').type('typing into one input{enter}');
            cy.getTestElement("@metadata/accountLabel/m/49'/0'/0'/success").should('be.visible');
            cy.getTestElement('@account-menu/btc/segwit/1').click();
            cy.getTestElement("@metadata/accountLabel/m/49'/0'/1'/success").should('not.exist');
            cy.getTestElement("@metadata/accountLabel/m/49'/0'/0'/success").should('not.exist');

            // go to another route that triggers discovery and check whether there are any requests to metadata providers
            cy.getTestElement('@suite/menu/suite-index').click();
            cy.getTestElement('@dashboard/graph');

            // todo: this assertion is flaky. turning it off for now
            // cy.waitUntil command is part of cypress-wait-until library which was already removed from the project
            //
            // cy.waitUntil(() =>
            //     cy.task('metadataGetRequests', { provider: f.provider }).then(requests => {
            //         const expectedNumberOfRequests =
            //             f.numberOfRequests[startEmuParams.version] ?? f.numberOfRequests.legacy;
            //         cy.log(
            //             `requests.length ${requests.length} of expected ${expectedNumberOfRequests[1]}`,
            //         );
            //         expect(requests.length).equal(expectedNumberOfRequests[1]);
            //     }),
            // );

            // test labeling of a newly added account
            cy.getTestElement('@account-menu/btc/normal/0').click();
            cy.getTestElement('@account-menu/add-account').click();
            cy.getTestElement('@settings/wallet/network/btc').click();
            cy.getTestElement('@add-account').click();
            cy.hoverTestElement("@metadata/accountLabel/m/84'/0'/2'/hover-container");
            cy.getTestElement("@metadata/accountLabel/m/84'/0'/2'/add-label-button").click();
            cy.getTestElement('@metadata/input').type(
                'adding label to a newly added account. does it work?{enter}',
            );
        });
    });
});

export {};
