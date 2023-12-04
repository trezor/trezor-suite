// @group:metadata
// @retry=2

import { rerouteMetadataToMockProvider, stubOpen } from '../../stubs/metadata';

const provider = 'google';

describe('Google api errors', () => {
    beforeEach(() => {
        cy.viewport(1080, 1440).resetDb();
        cy.task('startEmu', { wipe: true });
        cy.task('setupEmu', {
            mnemonic: 'all all all all all all all all all all all all',
        });
        cy.task('startBridge');
        cy.task('metadataStartProvider', provider);
        cy.prefixedVisit('/', {
            onBeforeLoad: (win: Window) => {
                cy.stub(win, 'open').callsFake(stubOpen(win));
                cy.stub(win, 'fetch').callsFake(rerouteMetadataToMockProvider);
            },
        });
        cy.passThroughInitialRun();
        cy.discoveryShouldFinish();
        cy.getTestElement('@account-menu/btc/normal/0').click();
    });

    it('Malformed token', () => {
        cy.getTestElement("@metadata/accountLabel/m/84'/0'/0'/add-label-button").click({
            force: true,
        });

        cy.passThroughInitMetadata(provider);

        // there are 3 retries in metadata provider. this test simulates that no retry has succeeded
        for (let i = 0; i < 4; i++) {
            // imitate response after sending request with malformed access token

            cy.task('metadataSetNextResponse', {
                provider,
                status: 401,
                body: {
                    error: {
                        errors: [
                            {
                                domain: 'global',
                                reason: 'authError',
                                message: 'Invalid Credentials',
                                locationType: 'header',
                                location: 'Authorization',
                            },
                        ],
                        code: 401,
                        message: 'Invalid Credentials',
                    },
                },
                headers: {
                    'Content-Type': 'application/json; charset=UTF-8',
                },
            });
        }

        cy.getTestElement('@toast/error').should(
            'contain',
            'Failed to load labeling data: Invalid Credentials',
        );
    });

    // todo: add more possible errors
    // https://developers.google.com/drive/api/v3/handle-errors
});

export {};
