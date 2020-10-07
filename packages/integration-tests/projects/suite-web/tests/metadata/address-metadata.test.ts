// @stable/metadata

import { rerouteDropbox, stubOpen } from '../../stubs/metadata';

const metadataEl = '@metadata/addressLabel/bc1q7e6qu5smalrpgqrx9k2gnf0hgjyref5p36ru2m';

describe('Metadata', () => {
    beforeEach(() => {
        cy.viewport(1024, 768).resetDb();
    });

    after(() => {
        cy.task('stopDropbox');
    });

    it('Address labeling', () => {
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

        cy.getTestElement('@wallet/menu/wallet-receive').click();
        cy.getTestElement(`${metadataEl}/add-label-button`).click({ force: true });
        cy.passThroughInitMetadata('dropbox');

        cy.getTestElement('@metadata/input').type('meoew address{enter}');

        cy.log('Already saved metadata shows dropdown onclick');
        cy.getTestElement(`${metadataEl}/edit-label-button`).click({ force: true });
        cy.getTestElement('@metadata/input').type(' meoew meow{enter}');

        // cy.log('confirming address on device adds copy address option to dropdown');
        // cy.getTestElement('@metadata/confirm-on-device-button/0').click();
        // cy.getTestElement('@modal/confirm-address/address-field').should('be.visible');
        // cy.getTestElement('@metadata/copy-address-button').should('not.be.visible');
        // cy.task('pressYes');
        // cy.getTestElement('@metadata/copy-address-button').should('be.visible');

        // cy.getTestElement('@metadata/copy-address-button').click();
    });
});
