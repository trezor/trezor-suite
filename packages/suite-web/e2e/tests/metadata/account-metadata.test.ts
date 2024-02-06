// @group:metadata
// @retry=2

import { rerouteMetadataToMockProvider, stubOpen } from '../../stubs/metadata';

const provider = 'dropbox';

describe(`Metadata is by default disabled, this means, that application does not try to generate master key and connect to cloud.
Hovering over fields that may be labeled shows "add label" button upon which is clicked, Suite initiates metadata flow`, () => {
    beforeEach(() => {
        cy.viewport(1080, 1440).resetDb();
    });

    it(provider, () => {
        // prepare test
        cy.task('startEmu', { wipe: true });
        cy.task('setupEmu', {
            mnemonic: 'all all all all all all all all all all all all',
        });
        cy.task(`metadataStartProvider`, provider);

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

        cy.passThroughInitMetadata(provider);

        cy.log('Edit and submit changes by pressing enter key');
        cy.getTestElement('@metadata/input').type(
            '{backspace}{backspace}{backspace}{backspace}{backspace}cool new label{enter}',
        );
        cy.getTestElement('@account-menu/btc/normal/0/label').should('contain', 'cool new label');

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

export {};
