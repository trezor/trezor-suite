// @stable/metadata

import { rerouteDropbox, stubOpen } from '../../stubs/metadata';

describe('Metadata', () => {
    beforeEach(() => {
        cy.viewport(1024, 768).resetDb();
    });

    after(() => {
        // cy.task('stopDropbox');
    });

    it('Output labeling', () => {
        const targetEl1 =
            '@metadata/outputLabel/9f472739fa7034dfb9736fa4d98915f2e8ddf70a86ee5e0a9ac0634f8c1d0007-0/add-label-button';
        // prepare test
        cy.task('startEmu', { wipe: true });
        cy.task('setupEmu');
        cy.task('startDropbox');

        const sentToMyselfEl =
            '@metadata/outputLabel/40242836cc07b635569688d12d63041935b86feb2db3fe575be80f2c44e5b4cb-0';

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

        cy.getTestElement(targetEl1).click({ force: true });
        cy.passThroughInitMetadata('dropbox');
        cy.getTestElement('@metadata/input').type('mnau cool label{enter}');

        cy.log('go to legacy account 6, it has txs with multiple outputs');
        cy.getTestElement('@account-menu/legacy').click();
        cy.getTestElement('@account-menu/btc/legacy/5/label').click();
        cy.getTestElement(
            '@metadata/outputLabel/b649a09e6d5d02b3cb4648a42511177efb6abf44366f30a51c1b202d52335d18-0/add-label-button',
        ).click({ force: true });

        cy.getTestElement(
            '@metadata/outputLabel/b649a09e6d5d02b3cb4648a42511177efb6abf44366f30a51c1b202d52335d18-1/add-label-button',
        ).click({ force: true });
        cy.getTestElement('@metadata/submit').should('have.length', 1);

        cy.getTestElement(
            '@metadata/outputLabel/b649a09e6d5d02b3cb4648a42511177efb6abf44366f30a51c1b202d52335d18-2/add-label-button',
        ).click({ force: true });
        cy.getTestElement('@metadata/input').type('output 3{enter}');

        cy.log('label "send to myself tx"');
        cy.getTestElement('@account-menu/btc/legacy/9/label').click();
        cy.getTestElement(`${sentToMyselfEl}/add-label-button`).click({ force: true });
        cy.getTestElement('@metadata/input').type('really to myself{enter}');

        cy.getTestElement(sentToMyselfEl).click();
        // dropdown/
        cy.getTestElement(`${sentToMyselfEl}/dropdown/edit-label`).click();
        cy.getTestElement('@metadata/input').type(' edited{enter}');

        cy.getTestElement(`${sentToMyselfEl}`).click();
        // todo: don't know why this does not end with success in tests but works for me when trying it manually.
        cy.getTestElement(`${sentToMyselfEl}/dropdown/copy-address`).click();

        // test that buttons work as well - submit button
        cy.getTestElement(`${sentToMyselfEl}`).click();
        cy.getTestElement(`${sentToMyselfEl}/dropdown/edit-label`).click();
        cy.getTestElement('@metadata/input').clear().type('submitted by button');
        cy.getTestElement('@metadata/submit').click();
        cy.getTestElement(`${sentToMyselfEl}`).should('contain', 'submitted by button');

        // test that buttons work as well - cancel button
        cy.getTestElement(`${sentToMyselfEl}`).click();
        cy.getTestElement(`${sentToMyselfEl}/dropdown/edit-label`).click();
        cy.getTestElement('@metadata/input').clear().type('write something that wont be saved');
        cy.getTestElement('@metadata/cancel').click();
        cy.getTestElement(`${sentToMyselfEl}`).should('contain', 'submitted by button');
    });
});
