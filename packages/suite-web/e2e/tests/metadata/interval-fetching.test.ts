// @group:metadata
// @retry=2

import * as METADATA from '@trezor/suite/src/actions/suite/constants/metadataConstants';

import { rerouteMetadataToMockProvider, stubOpen } from '../../stubs/metadata';

const fixtures = [
    {
        provider: 'google',
        desc: 'does NOT watch files over time',
        file: 'b9b5e1fd2800d4dc68e2f4e775fd819f4da3fb9e1bcc2cacd7f04fa543eac8a0_v2.mtdt',
        content: 'already existing label',
    },
    {
        provider: 'dropbox',
        desc: 'does watch files over time',
        file: '/b9b5e1fd2800d4dc68e2f4e775fd819f4da3fb9e1bcc2cacd7f04fa543eac8a0_v2.mtdt',
        content: 'label from another window',
    },
] as const;

describe('Metadata - suite is watching cloud provider and syncs periodically', () => {
    beforeEach(() => {
        cy.viewport(1080, 1440).resetDb();
    });
    fixtures.forEach(f => {
        it(`${f.provider}-${f.desc}`, () => {
            // prepare test
            cy.task('startEmu', { wipe: true });
            cy.task('setupEmu', {
                mnemonic: 'all all all all all all all all all all all all',
            });
            cy.task('startBridge');
            cy.task('metadataStartProvider', f.provider);
            cy.clock();
            // prepare some initial files
            cy.task('metadataSetFileContent', {
                provider: f.provider,
                file: f.file,
                content: {
                    version: '1.0.0',
                    accountLabel: 'already existing label',
                    outputLabels: {},
                    addressLabels: {},
                },
                aesKey: '998daf71f3fbc486076f0ee8d5737a61b82bceacb0ec69100cbe4d45cd79676a',
            });
            cy.prefixedVisit('/', {
                onBeforeLoad: win => {
                    cy.stub(win, 'open').callsFake(stubOpen(win));
                    cy.stub(win, 'fetch').callsFake(rerouteMetadataToMockProvider);
                },
            });
            cy.tick(1000);
            cy.passThroughInitialRun();
            cy.log(
                'Wait for discovery to finish. There is "add label" button, but no actual metadata appeared',
            );
            cy.discoveryShouldFinish();
            cy.getTestElement('@suite/menu/wallet-index').click();

            cy.getTestElement("@metadata/accountLabel/m/84'/0'/0'/add-label-button").click({
                force: true,
            });
            cy.passThroughInitMetadata(f.provider);

            cy.log('Already existing label gets loaded');
            cy.getTestElement('@account-menu/btc/normal/0/label').should(
                'contain',
                'already existing label',
            );
            cy.get('body').type('{enter}');

            cy.task('metadataSetFileContent', {
                provider: f.provider,
                file: f.file,
                content: {
                    version: '1.0.0',
                    accountLabel: 'label from another window',
                    outputLabels: {},
                    addressLabels: {},
                },
                aesKey: '998daf71f3fbc486076f0ee8d5737a61b82bceacb0ec69100cbe4d45cd79676a',
            });

            // and this does the time travel to trigger fetch
            cy.tick(METADATA.FETCH_INTERVAL);
            cy.getTestElement('@account-menu/btc/normal/0/label').should('contain', f.content);
        });
    });
});

export {};
