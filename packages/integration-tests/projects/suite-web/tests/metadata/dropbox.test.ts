// @stable/metadata

import { rerouteDropbox, stubOpen } from '../../stubs/metadata';

// probably not needed
describe.skip('Metadata', () => {
    beforeEach(() => {
        cy.viewport(1024, 768).resetDb();
    });

    after(() => {
        // cy.task('stopGoogle');
    });

    it(`mnau`, () => {
        // prepare test
        cy.task('startEmu', { wipe: true });
        cy.task('setupEmu');
        cy.task('startDropbox');

        cy.prefixedVisit('/settings/coins', {
            onBeforeLoad: (win: Window) => {
                cy.stub(win, 'open', stubOpen(win));
                cy.stub(win, 'fetch', rerouteDropbox);
            },
        });

        cy.passThroughInitialRun();

        cy.getTestElement('@settings/wallet/coins-group/mainnet/deactivate-all').click();
        cy.getTestElement('@settings/wallet/network/xrp').click({ force: true });
        cy.getTestElement('@suite/menu/wallet-index').click();

        // todo: better waiting for discovery (mock it!)
        cy.getTestElement('@wallet/loading-other-accounts', { timeout: 30000 });
        cy.getTestElement('@wallet/loading-other-accounts', { timeout: 30000 }).should(
            'not.be.visible',
        );

        // cy.log(
        //     'Default label is "Bitcoin #1". Clicking it in accounts menu is not possible. User can click on label in accounts sections. This triggers metadata flow',
        // );
        cy.getTestElement('@account-menu/xrp/normal/0/label').should('contain', 'XRP');
        cy.wait(5000);
        cy.getTestElement("@metadata/accountLabel/m/44'/144'/0'/0/0/add-label-button").click({
            force: true,
        });
        cy.passThroughInitMetadata('dropbox');

        cy.getTestElement('@metadata/input').should('have.value', '');

        cy.getTestElement('@metadata/input').type('new label{enter}');
        cy.getTestElement('@suite/menu/suite-index').click();
        cy.getTestElement('@dashboard/index');
        cy.wait(1000);
        cy.getTestElement('@suite/menu/wallet-index').click();

        cy.wait(10000);
    });
});
