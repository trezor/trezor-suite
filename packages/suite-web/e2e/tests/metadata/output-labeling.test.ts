// @group:metadata
// @retry=2

import { rerouteMetadataToMockProvider, stubOpen } from '../../stubs/metadata';

// we could run this test for multiple providers but it does not give so much value at the moment
const providers = ['google'] as const;

describe('Metadata - Output labeling', () => {
    beforeEach(() => {
        cy.viewport(1080, 1440).resetDb();
        cy.task('rmDir', { dir: Cypress.config('downloadsFolder'), recursive: true, force: true });
    });

    providers.forEach(provider => {
        it(provider, () => {
            const targetEl1 =
                '@metadata/outputLabel/9f472739fa7034dfb9736fa4d98915f2e8ddf70a86ee5e0a9ac0634f8c1d0007-0/add-label-button';
            // prepare test
            cy.task('startEmu', { wipe: true });
            cy.task('setupEmu', {
                mnemonic: 'all all all all all all all all all all all all',
            });
            cy.task('startBridge');
            cy.task('metadataStartProvider', provider);

            const sentToMyselfEl =
                '@metadata/outputLabel/40242836cc07b635569688d12d63041935b86feb2db3fe575be80f2c44e5b4cb-0';

            cy.prefixedVisit('/', {
                onBeforeLoad: (win: Window) => {
                    cy.stub(win, 'open').callsFake(stubOpen(win));
                    cy.stub(win, 'fetch').callsFake(rerouteMetadataToMockProvider);
                },
            });

            cy.passThroughInitialRun();

            cy.discoveryShouldFinish();
            cy.getTestElement('@account-menu/btc/normal/0').click();
            cy.getTestElement('@wallet/accounts/pagination/2').click();

            cy.getTestElement(targetEl1).click({ force: true });
            cy.passThroughInitMetadata(provider);
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

            cy.getTestElement(sentToMyselfEl).click({ force: true });
            // dropdown/
            cy.getTestElement(`${sentToMyselfEl}/dropdown/edit-label`).click({ force: true });
            cy.getTestElement('@metadata/input').type(' edited{enter}');

            // just check there is copy address button, as of cypress 13.4.0 there is some problem to click on it (breaks tests locally)
            cy.getTestElement(`${sentToMyselfEl}`).click({ force: true });
            cy.getTestElement(`${sentToMyselfEl}/dropdown/copy-address`);

            // test that buttons work as well - submit button
            cy.getTestElement(`${sentToMyselfEl}/dropdown/edit-label`).click({ force: true });
            cy.getTestElement('@metadata/input').clear().type('submitted by button');
            cy.getTestElement('@metadata/submit').click({ force: true });
            cy.getTestElement(`${sentToMyselfEl}`).should('contain', 'submitted by button');

            // test that buttons work as well - cancel button
            cy.getTestElement(`${sentToMyselfEl}`).click({ force: true });
            cy.getTestElement(`${sentToMyselfEl}/dropdown/edit-label`).click({ force: true });
            cy.getTestElement('@metadata/input').clear().type('write something that wont be saved');
            cy.getTestElement('@metadata/cancel').click({ force: true });
            cy.getTestElement(`${sentToMyselfEl}`).should('contain', 'submitted by button');

            // validate that exporting transactions exports also labels
            // note: having trouble using here due to inability to scroll to that element, so I am using force here
            // onAccountsPage.exportDesiredTransactionType('csv');
            cy.getTestElement('@wallet/accounts/export-transactions/dropdown').click({
                force: true,
            });
            cy.getTestElement(`@wallet/accounts/export-transactions/csv`).click({
                force: true,
            });

            cy.wait(1000);
            cy.task('readDir', Cypress.config('downloadsFolder')).then((dir: any) => {
                cy.task('readFile', `${Cypress.config('downloadsFolder')}/${dir[0]}`).then(
                    (file: any) => {
                        const expectedSubstr =
                            '1PmVvr5DNVYJygtDT7J312qmxpa5pceu9E;submitted by button';
                        expect(file).to.include(expectedSubstr);
                        cy.wrap(file).should('be.a', 'string');
                    },
                );
            });
        });
    });
});

export {};
