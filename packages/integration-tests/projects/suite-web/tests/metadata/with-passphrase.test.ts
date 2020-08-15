// @stable

import { stubFetch, stubOpen } from '../../stubs/metadata';

// todo think about it
describe('Metadata', () => {
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
        cy.log('after initial passphrase input starts discovery which also triggers metadata init flow');
        cy.passThroughInitMetadata();

        cy.log('at this moment, metadata is connected and user returns back to passphrase validation');
        cy.getTestElement('@passphrase/input').type('make metadata gr8 again');
        cy.getTestElement('@passphrase/confirm-checkbox').click();
        cy.getTestElement('@passphrase/hidden/submit-button').click();
    });
});
