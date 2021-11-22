// @group:metadata
// @retry=2

import { rerouteMetadataToMockProvider, stubOpen } from '../../stubs/metadata';

const providers = ['dropbox', 'google'] as const;

const metadataEl = '@metadata/addressLabel/bc1q7e6qu5smalrpgqrx9k2gnf0hgjyref5p36ru2m';

describe('Metadata - address labeling', () => {
    beforeEach(() => {
        cy.viewport(1024, 768).resetDb();
    });

    providers.forEach(provider => {
        it(provider, () => {
            // prepare test
            cy.task('startEmu', { wipe: true });
            cy.task('setupEmu', {
                mnemonic: 'all all all all all all all all all all all all',
            });
            cy.task('startBridge');
            cy.task('metadataStartProvider', provider);
            cy.prefixedVisit('/', {
                onBeforeLoad: (win: Window) => {
                    cy.stub(win, 'open', stubOpen(win));
                    cy.stub(win, 'fetch', rerouteMetadataToMockProvider);
                },
            });

            cy.passThroughInitialRun();

            cy.getTestElement('@suite/menu/wallet-index').click();

            cy.discoveryShouldFinish();

            cy.getTestElement('@wallet/menu/wallet-receive').click();
            cy.getTestElement(`${metadataEl}/add-label-button`).click({ force: true });
            cy.passThroughInitMetadata(provider);

            cy.getTestElement('@metadata/input').type('meoew address{enter}');
            cy.wait(2001); // reasonable here, elements visible only on hover are difficult to wait for in cypress
            cy.getTestElement(`${metadataEl}/edit-label-button`).click({ force: true });
            cy.getTestElement('@metadata/input').type(' meoew meow{enter}');
        });
    });
});
