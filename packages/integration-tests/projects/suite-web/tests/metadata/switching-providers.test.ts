// @group:metadata
// @retry=2

import { rerouteMetadataToMockProvider, stubOpen } from '../../stubs/metadata';

describe(`Metadata - switching between cloud providers`, () => {
    beforeEach(() => {
        // use portrait mode monitor to prevent scrolling in settings
        cy.viewport(1080, 1440).resetDb();
    });

    it('Start with one and switch to another', () => {
        // prepare test
        cy.task('startEmu', { wipe: true });
        cy.task('setupEmu', {
            mnemonic: 'all all all all all all all all all all all all',
        });
        cy.task('startBridge');
        cy.task(`metadataStartProvider`, 'dropbox');
        cy.task(`metadataStartProvider`, 'google');

        cy.prefixedVisit('/', {
            onBeforeLoad: (win: Window) => {
                cy.stub(win, 'open').callsFake(stubOpen(win));
                cy.stub(win, 'fetch').callsFake(rerouteMetadataToMockProvider);
            },
        });
        cy.passThroughInitialRun();
        cy.discoveryShouldFinish();
        cy.getTestElement('@suite/menu/wallet-index').click();

        cy.log('');
        cy.getTestElement('@account-menu/btc/normal/0/label').should('contain', 'Bitcoin');

        cy.getTestElement("@metadata/accountLabel/m/84'/0'/0'/add-label-button").click({
            force: true,
        });
        cy.passThroughInitMetadata('dropbox');

        cy.getTestElement('@metadata/input').type('dropbox label {enter}');
        cy.getTestElement('@account-menu/btc/normal/0/label').should('contain', 'dropbox label');

        cy.getTestElement('@suite/menu/settings').click();
        cy.getTestElement('@suite/menu/settings-index').click();
        cy.getTestElement('@settings/metadata/disconnect-provider-button').click();
        cy.getTestElement('@settings/metadata/connect-provider-button').should('be.visible');

        cy.getTestElement('@suite/menu/wallet-index').click();
        cy.log('Disconnecting removes labels');
        cy.getTestElement('@account-menu/btc/normal/0/label').should('contain', 'Bitcoin');

        cy.getTestElement("@metadata/accountLabel/m/84'/0'/0'/add-label-button").click({
            force: true,
        });

        cy.getTestElement('@modal/metadata-provider').should('be.visible');
        cy.getTestElement('@modal/metadata-provider/file-system-button').should('not.exist');
        cy.getTestElement('@modal/metadata-provider/google-button').click();
        cy.getTestElement('@modal/metadata-provider').should('not.exist');

        cy.getTestElement('@metadata/input').type('google label {enter}');
        cy.getTestElement('@account-menu/btc/normal/0/label').should('contain', 'google label');
    });
});
