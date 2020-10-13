// @group:metadata
// @retry=2

import * as METADATA from '../../../../../suite/src/actions/suite/constants/metadataConstants';

import { rerouteDropbox, stubOpen } from '../../stubs/metadata';

describe('Metadata', () => {
    beforeEach(() => {
        cy.viewport(1024, 768).resetDb();
    });
    after(() => {
        cy.task('stopDropbox');
    });

    it('suite is watching cloud provider and syncs periodically', () => {
        // prepare test
        cy.task('startEmu', { wipe: true });
        cy.task('setupEmu');
        cy.task('startDropbox');
        cy.clock();
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
            onBeforeLoad: win => {
                cy.stub(win, 'open', stubOpen(win));
                cy.stub(win, 'fetch', rerouteDropbox);
            },
        });
        cy.tick(1000);

        cy.passThroughInitialRun();
        cy.log(
            'Wait for discovery to finish. There is "add label" button, but no actual metadata appeared',
        );
        // todo: better waiting for discovery (mock it!)
        cy.getTestElement('@wallet/loading-other-accounts', { timeout: 30000 });
        cy.getTestElement('@wallet/loading-other-accounts', { timeout: 30000 }).should(
            'not.be.visible',
        );
        cy.getTestElement("@metadata/accountLabel/m/84'/0'/0'/add-label-button").click({
            force: true,
        });
        cy.passThroughInitMetadata('dropbox');

        cy.log('Already existing label gets loaded');
        cy.getTestElement('@account-menu/btc/normal/0/label').should(
            'contain',
            'already existing label',
        );
        cy.get('body').type('{enter}');

        cy.task('setFileContent', {
            provider: 'dropbox',
            file:
                '/apps/trezor/f7acc942eeb83921892a95085e409b3e6b5325db6400ae5d8de523a305291dca.mtdt',
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
        cy.getTestElement('@account-menu/btc/normal/0/label').should(
            'contain',
            'label from another window',
        );
    });
});
