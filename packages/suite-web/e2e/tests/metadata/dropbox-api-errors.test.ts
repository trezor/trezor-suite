// @group:metadata
// @retry=2

import { rerouteMetadataToMockProvider, stubOpen } from '../../stubs/metadata';

describe('Dropbox api errors', () => {
    beforeEach(() => {
        cy.viewport(1080, 1440).resetDb();
    });

    it('Malformed token', () => {
        cy.task('startEmu', { wipe: true });
        cy.task('setupEmu', {
            mnemonic: 'all all all all all all all all all all all all',
        });
        cy.task('startBridge');
        cy.task('metadataStartProvider', 'dropbox');
        // prepare some initial files
        cy.task('metadataSetFileContent', {
            provider: 'dropbox',
            file: '/apps/trezor/f7acc942eeb83921892a95085e409b3e6b5325db6400ae5d8de523a305291dca.mtdt',
            content: {
                version: '1.0.0',
                accountLabel: 'already existing label',
                outputLabels: {},
                addressLabels: {},
            },
            aesKey: 'c785ef250807166bffc141960c525df97647fcc1bca57f6892ca3742ba86ed8d',
        });
        cy.prefixedVisit('/', {
            onBeforeLoad: (win: Window) => {
                cy.stub(win, 'open').callsFake(stubOpen(win));
                cy.stub(win, 'fetch').callsFake(rerouteMetadataToMockProvider);
            },
        });

        cy.passThroughInitialRun();
        cy.discoveryShouldFinish();

        cy.getTestElement('@suite/menu/settings').click();
        cy.getTestElement('@settings/metadata-switch').click({ force: true });

        cy.passThroughInitMetadata('dropbox');

        cy.getTestElement('@suite/menu/wallet-index').click();

        cy.getTestElement("@metadata/accountLabel/m/84'/0'/0'").click({ force: true });
        cy.getTestElement("@metadata/accountLabel/m/84'/0'/0'/edit-label-button").click({
            force: true,
        });

        cy.log('at this moment, we send wrong token in request');

        cy.task('metadataSetNextResponse', {
            provider: 'dropbox',
            status: 400,
            body: 'Error in call to API function "files/upload": The given OAuth 2 access token is malformed.',
            headers: {
                'Content-Type': 'text/plain; charset=utf-8',
            },
        });

        cy.getTestElement('@metadata/input').type('Kvooo{enter}');

        cy.getTestElement('@toast/error').should(
            'contain',
            'Error in call to API function "files/upload": The given OAuth 2 access token is malformed.',
        );
    });

    // todo: add more possible errors
});
