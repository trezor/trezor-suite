// @group:metadata
// @retry=2

import { rerouteDropbox, stubOpen } from '../../stubs/metadata';

describe('Dropbox api errors', () => {
    beforeEach(() => {
        cy.viewport(1024, 768).resetDb();
    });
    after(() => {
        cy.task('stopDropbox');
    });

    it('Malformed token', () => {
        cy.task('startEmu', { wipe: true });
        cy.task('setupEmu');
        cy.task('startDropbox');
        // prepare some initial files
        cy.task('setFileContent', {
            provider: 'dropbox',
            file:
                '/apps/trezor/f7acc942eeb83921892a95085e409b3e6b5325db6400ae5d8de523a305291dca.mtdt',
            content: {
                version: '1.0.0',
                accountLabel: 'already existing label',
                outputLabels: {},
                addressLabels: {},
            },
            aesKey: 'c785ef250807166bffc141960c525df97647fcc1bca57f6892ca3742ba86ed8d',
        });
        cy.prefixedVisit('/accounts', {
            onBeforeLoad: (win: Window) => {
                cy.stub(win, 'open', stubOpen(win));
                cy.stub(win, 'fetch', rerouteDropbox);
            },
        });

        cy.passThroughInitialRun();

        // todo: wait for discovery to finish and remove this
        cy.getTestElement('@wallet/loading-other-accounts', { timeout: 30000 });
        cy.getTestElement('@wallet/loading-other-accounts', { timeout: 30000 }).should(
            'not.be.visible',
        );

        cy.getTestElement('@suite/menu/settings-index').click();
        cy.getTestElement('@settings/metadata-switch').click({ force: true });

        cy.passThroughInitMetadata('dropbox');

        cy.getTestElement('@suite/menu/wallet-index').click();

        cy.getTestElement("@metadata/accountLabel/m/84'/0'/0'").click({ force: true });
        cy.getTestElement("@metadata/accountLabel/m/84'/0'/0'/edit-label-button").click({
            force: true,
        });

        cy.log('at this moment, we send wrong token in request');

        cy.task('setNextResponse', {
            provider: 'dropbox',
            status: 400,
            body:
                'Error in call to API function "files/upload": The given OAuth 2 access token is malformed.',
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
