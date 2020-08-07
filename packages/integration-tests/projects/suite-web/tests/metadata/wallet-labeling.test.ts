// @stable

import { stubFetch, stubOpen } from '../../stubs/metadata';

describe('Metadata', () => {
    beforeEach(() => {
        cy.viewport(1024, 768).resetDb();
    });
    
    after(() => {
        cy.task('stopGoogle');
    });

    it(`
        Wallet labeling
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

            cy.getTestElement('@menu/switch-device').click();
            cy.getTestElement('@metadata/walletLabel/standard-wallet/add-label-button').click({force: true });
            cy.passThroughInitMetadata();

            // todo: hmm focus lock troubles?
            cy.getTestElement('@metadata/walletLabel/standard-wallet/add-label-button').click({force: true });

            cy.getTestElement('@metadata/input').type('label for standard wallet{enter}');
            cy.getTestElement('@metadata/walletLabel/standard-wallet').click();
            cy.getTestElement('@metadata/edit-button').click();
            cy.getTestElement('@metadata/input').clear().type('wallet for drugs{enter}');

            cy.getTestElement('@switch-device/add-wallet-button').click();
            cy.getConfirmActionOnDeviceModal();
            cy.task('pressYes');
            cy.getTestElement('@passphrase/input').type('abc');
            cy.getTestElement('@passphrase/hidden/submit-button').click();
            cy.getTestElement('@passphrase/input').type('abc');
            cy.getTestElement('@passphrase/confirm-checkbox').click();
            cy.getTestElement('@passphrase/hidden/submit-button').click();

            cy.getTestElement('@suite/loading').should('not.be.visible');
            cy.getTestElement('@menu/switch-device').click({ force: true });
            cy.getTestElement('@metadata/walletLabel/standard-wallet').should('contain', 'wallet for drugs');

            cy.log('we need new master key');
            cy.getTestElement('@metadata/walletLabel/hidden-wallet-1/add-label-button').click({force: true });
            cy.getConfirmActionOnDeviceModal();
            cy.task('pressYes');
            // focus lock? :(
            cy.getTestElement('@metadata/walletLabel/hidden-wallet-1/add-label-button').click({force: true });
            cy.getTestElement('@metadata/input').type('wallet not for drugs{enter}');
            cy.getTestElement('@metadata/walletLabel/hidden-wallet-1').should('contain', 'wallet not for drugs');
    });
});
