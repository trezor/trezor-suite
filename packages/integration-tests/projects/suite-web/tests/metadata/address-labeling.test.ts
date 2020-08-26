// @stable

import { stubFetch, stubOpen } from '../../stubs/metadata';

const metadataEl = '@metadata/addressLabel/bc1q7e6qu5smalrpgqrx9k2gnf0hgjyref5p36ru2m';

describe('Metadata', () => {
    beforeEach(() => {
        cy.viewport(1024, 768).resetDb();
    });
    
    after(() => {
        cy.task('stopGoogle');
    });

    it(`
        Address labeling
        `, () => {
            // prepare test
            cy.task('startEmu', { wipe: true });
            cy.task('setupEmu');
            cy.task('startGoogle');

            cy.prefixedVisit('/accounts', { onBeforeLoad: (win: Window) => {
                cy.stub(win, 'open', stubOpen(win));
                cy.stub(win, 'fetch', stubFetch)
            }});
    
            cy.passThroughInitialRun();
            
            // todo: better waiting for discovery (mock it!)
            cy.getTestElement('@wallet/loading-other-accounts', { timeout: 30000 });
            cy.getTestElement('@wallet/loading-other-accounts', { timeout: 30000 }).should('not.be.visible');

            cy.getTestElement('@wallet/menu/wallet-receive').click();
            cy.getTestElement(`${metadataEl}/add-label-button`).click({force: true });
            cy.passThroughInitMetadata();

            cy.getTestElement('@metadata/input').type('meoew address{enter}');

            cy.log('Already saved metadata shows dropdown onclick');
            cy.getTestElement(metadataEl).click();
            cy.getTestElement('@metadata/confirm-on-device-button').should('be.visible');
            cy.getTestElement('@metadata/copy-address-button').should('not.be.visible');
            cy.getTestElement(`@metadata/edit-button`).click();
            cy.getTestElement('@metadata/input').type(' meoew meow{enter}');

            cy.log('confirming address on device adds copy address option to dropdown');
            cy.getTestElement(metadataEl).click();
            cy.getTestElement('@metadata/confirm-on-device-button').click();
            cy.getTestElement('@modal/confirm-address/address-field').should('be.visible');
            cy.task('pressYes');
            cy.getTestElement('@modal/confirm-address/address-field').should('not.be.visible');

            cy.getTestElement('@metadata/copy-address-button').click();
    });
});
