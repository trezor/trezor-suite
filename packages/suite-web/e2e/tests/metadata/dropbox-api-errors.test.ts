// @group:metadata
// @retry=2

import { rerouteMetadataToMockProvider, stubOpen } from '../../stubs/metadata';

describe('Dropbox api errors', () => {
    beforeEach(() => {
        cy.viewport(1440, 2560).resetDb();
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
            file: '/f7acc942eeb83921892a95085e409b3e6b5325db6400ae5d8de523a305291dca.mtdt',
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

        cy.getTestElement('@account-menu/btc/normal/0').click();

        cy.getTestElement("@metadata/accountLabel/m/84'/0'/0'").click({ force: true });
        cy.getTestElement("@metadata/accountLabel/m/84'/0'/0'/edit-label-button").click({
            force: true,
        });

        cy.log('at this moment, we send wrong token in request');

        // there are 3 retries in metadata provider. this test simulates that no retry has succeeded
        for (let i = 0; i < 4; i++) {
            cy.task('metadataSetNextResponse', {
                provider: 'dropbox',
                status: 400,
                body: 'Error in call to API function "files/upload": The given OAuth 2 access token is malformed.',
                headers: {
                    'Content-Type': 'text/plain; charset=utf-8',
                },
            });
        }
        cy.getTestElement('@metadata/input').type('Kvooo{enter}');

        cy.getTestElement('@toast/error').should(
            'contain',
            'Error in call to API function "files/upload": The given OAuth 2 access token is malformed.',
        );
    });

    it('Success after retrying GET request', () => {
        cy.task('startEmu', { wipe: true });
        cy.task('setupEmu', {
            mnemonic: 'all all all all all all all all all all all all',
        });
        cy.task('startBridge');
        cy.task('metadataStartProvider', 'dropbox');
        // prepare some initial files
        cy.task('metadataSetFileContent', {
            provider: 'dropbox',
            file: '/f7acc942eeb83921892a95085e409b3e6b5325db6400ae5d8de523a305291dca.mtdt',
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

        // this request is not retried
        cy.task('metadataSetNextResponse', {
            provider: 'dropbox',
            status: 200,
            body: {
                name: {
                    given_name: 'dog',
                    surname: 'cat',
                    familiar_name: 'kitty-dog',
                    display_name: 'dog-cat',
                    abbreviated_name: 'DC',
                },
                email: 'some@mail.com',
                email_verified: true,
                profile_photo_url: 'foo',
                disabled: false,
                country: 'CZ',
                locale: 'en',
                referral_link: 'foo',
                is_paired: false,
            },
        });

        // this one is -> simulate rate limitted scenario
        cy.task('metadataSetNextResponse', {
            provider: 'dropbox',
            status: 429,
            body: 'Rate limited!',
            headers: {
                'Content-Type': 'text/plain; charset=utf-8',
            },
        });
        cy.getTestElement('@account-menu/btc/normal/0').click();

        cy.getTestElement("@metadata/accountLabel/m/84'/0'/0'").click({ force: true });
        cy.getTestElement("@metadata/accountLabel/m/84'/0'/0'/edit-label-button").click({
            force: true,
        });

        cy.getTestElement('@metadata/input').type('Kvooo{enter}');
    });

    it('Incomplete data returned from provider', () => {
        cy.task('startEmu', { wipe: true });
        cy.task('setupEmu', {
            mnemonic: 'all all all all all all all all all all all all',
        });
        cy.task('startBridge');
        cy.task('metadataStartProvider', 'dropbox');
        // prepare some initial files
        cy.task('metadataSetFileContent', {
            provider: 'dropbox',
            file: '/f7acc942eeb83921892a95085e409b3e6b5325db6400ae5d8de523a305291dca.mtdt',
            content: {
                version: '1.0.0',
                accountLabel: 'already existing label',
                // note: outputLabels and addressLabels are missing. this can happen in 2 situations:
                // 1] user manually changed the files (very unlikely);
                // 2] we screwed app data saving or reading
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

        // just enter some label, this indicates that app did not crash
        cy.getTestElement('@account-menu/btc/normal/0').click();

        cy.hoverTestElement("@metadata/accountLabel/m/84'/0'/0'/hover-container");
        cy.getTestElement("@metadata/accountLabel/m/84'/0'/0'").click({ force: true });
        cy.getTestElement("@metadata/accountLabel/m/84'/0'/0'/edit-label-button").click({
            force: true,
        });
        cy.getTestElement('@metadata/input').type('label{enter}');
    });

    // todo: add more possible errors
});

export {};
