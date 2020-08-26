// @stable/metadata

import { stubFetch, stubOpen } from '../../stubs/metadata';

// todo think about it there is probably little "bug". If user goes directly to 
// to settings, his undiscovered wallet appears as hidden-wallet 1 in menu
// also trying to add hidden wallet from wallets modal opens extended passphrase 
// modal dialog. Weird from UX perspective but works. So I need to discuss it.
describe.skip('Metadata', () => {
    beforeEach(() => {
        cy.viewport(1024, 768).resetDb();
    });
    after(() => {
        cy.task('stopGoogle');
    });

    it(`
        When passphrase is enabled, 
    `, () => {
        cy.task('startEmu', { wipe: true });
        cy.task('setupEmu', { passphrase_protection: true });
        cy.task('startGoogle');

        cy.prefixedVisit('/settings', { onBeforeLoad: (win: Window) => {
            cy.stub(win, 'open', stubOpen(win));
            cy.stub(win, 'fetch', stubFetch);
        }});

        cy.passThroughInitialRun();
        cy.getTestElement('@settings/metadata-switch').click({ force: true });
        cy.getTestElement('@suite/menu/wallet-index').click();
        cy.getTestElement('@passphrase/input').type('make metadata gr8 again');
        cy.getTestElement('@passphrase/hidden/submit-button').click();

        cy.getTestElement('@passphrase/input').type('make metadata gr8 again');
        cy.getTestElement('@passphrase/confirm-checkbox').click();
        cy.getTestElement('@passphrase/hidden/submit-button').click();
        cy.getTestElement('@suite/loading').should('not.exist');
        cy.getTestElement("@metadata/accountLabel/m/84'/0'/0'/add-label-button").should('not.be.disabled').click({ force: true });

        cy.passThroughInitMetadata();
        cy.getTestElement('@metadata/input').type('hidden wallet first account{enter}');

        cy.getTestElement('@menu/switch-device').click();
        cy.getTestElement('@switch-device/add-wallet-button').click();
        
        cy.log('Now going back to standard wallet means that we need master key (not been there before)');
        cy.getTestElement('@passphrase/standard/submit-button').click();
        cy.getConfirmActionOnDeviceModal();
        cy.task('pressYes');
        cy.log('Note that metadata provider is already connected so no need to ask');
    });
});
