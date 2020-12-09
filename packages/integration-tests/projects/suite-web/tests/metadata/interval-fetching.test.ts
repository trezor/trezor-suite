// @group:metadata
// @retry=2

import * as METADATA from '../../../../../suite/src/actions/suite/constants/metadataConstants';

import { rerouteMetadataToMockProvider, stubOpen } from '../../stubs/metadata';

const fixtures = [
    {
        provider: 'google',
        desc: 'does NOT watch files over time',
        file: 'f7acc942eeb83921892a95085e409b3e6b5325db6400ae5d8de523a305291dca.mtdt',
        content: 'already existing label',
    },
    {
        provider: 'dropbox',
        desc: 'does watch files over time',
        file: '/apps/trezor/f7acc942eeb83921892a95085e409b3e6b5325db6400ae5d8de523a305291dca.mtdt',
        content: 'label from another window',
    },
] as const;

describe('Metadata - suite is watching cloud provider and syncs periodically', () => {
    beforeEach(() => {
        cy.viewport(1024, 768).resetDb();
    });
    fixtures.forEach(f => {
        it(`${f.provider}-${f.desc}`, () => {
            // prepare test
            cy.task('startEmu', { wipe: true });
            cy.task('setupEmu');
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
                aesKey: 'c785ef250807166bffc141960c525df97647fcc1bca57f6892ca3742ba86ed8d',
            });
            cy.prefixedVisit('/accounts', {
                onBeforeLoad: win => {
                    cy.stub(win, 'open', stubOpen(win));
                    cy.stub(win, 'fetch', rerouteMetadataToMockProvider);
                },
            });
            cy.tick(1000);

            cy.passThroughInitialRun();
            cy.log(
                'Wait for discovery to finish. There is "add label" button, but no actual metadata appeared',
            );
            cy.discoveryShouldFinish();
            
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
                aesKey: 'c785ef250807166bffc141960c525df97647fcc1bca57f6892ca3742ba86ed8d',
            });

            // and this does the time travel to trigger fetch
            cy.tick(METADATA.FETCH_INTERVAL);
            cy.getTestElement('@account-menu/btc/normal/0/label').should('contain', f.content);
        });
    });
});
