// @group_metadata

import { rerouteMetadataToMockProvider, stubOpen } from '../../stubs/metadata';

const originalFileName = '/f7acc942eeb83921892a95085e409b3e6b5325db6400ae5d8de523a305291dca.mtdt';
const migratedFileName =
    '/b9b5e1fd2800d4dc68e2f4e775fd819f4da3fb9e1bcc2cacd7f04fa543eac8a0_v2.mtdt';
const renamedFileName = '/f7acc942eeb83921892a95085e409b3e6b5325db6400ae5d8de523a305291dca_v1.mtdt';
const mnemonic = 'all all all all all all all all all all all all';

const provider = 'dropbox' as const;

describe('Metadata - metadata files are properly migrated from ENCRYPTION_VERSION v1 to v2', () => {
    beforeEach(() => {
        cy.viewport(1080, 1440).resetDb();
    });

    it(`should migrate metadata file from v1 to v2 using ${provider}`, () => {
        cy.task('startEmu', {
            wipe: true,
            // todo: remove, nothing but that works for me locally
            version: '2.6.3',
        });
        cy.task('setupEmu', {
            mnemonic,
        });
        cy.task('startBridge');
        cy.prefixedVisit('/', {
            onBeforeLoad: (win: Window) => {
                cy.stub(win, 'open').callsFake(stubOpen(win));
                cy.stub(win, 'fetch').callsFake(rerouteMetadataToMockProvider);
            },
        });

        cy.passThroughInitialRun();
        cy.discoveryShouldFinish();

        cy.getTestElement('@suite/menu/settings').click();
        // initialize provider
        cy.task('metadataStartProvider', provider);
        cy.task('metadataSetFileContent', {
            provider,
            file: originalFileName,
            content: {
                version: '1.0.0',
                accountLabel: 'some account label',
                outputLabels: {},
                addressLabels: {},
            },
            aesKey: 'c785ef250807166bffc141960c525df97647fcc1bca57f6892ca3742ba86ed8d',
        });

        // enable encryption v2 through experimental features
        cy.enableDebugMode();
        cy.getTestElement('@settings/experimental-switch').click({ force: true });
        cy.getTestElement('@experimental-feature/confirm-less-labeling/checkbox').click();

        // enable labeling
        cy.getTestElement(`@modal/metadata-provider/${provider}-button`).click();
        cy.getTestElement('@modal/metadata-provider').should('not.exist');
        // appears only when a migration is needed
        cy.getConfirmActionOnDeviceModal();
        cy.task('pressYes');

        // wait until migration finishes
        cy.getTestElement('@settings/metadata-switch').get('input').should('not.be.disabled');

        // check if the file has been migrated
        cy.task('metadataGetFilesList', { provider }).then(f => {
            const files = f as string[];
            const isFileMigrated = files.includes(migratedFileName);
            const isFileRenamed = files.includes(renamedFileName);
            expect(isFileMigrated).to.be.true;
            expect(isFileRenamed).to.be.true;
            expect(files.length).to.have.least(2); // dummies were created
        });

        // check if the label is there after migration
        cy.getTestElement('@account-menu/btc/normal/0/label').should(
            'contain',
            'some account label',
        );

        // toggle labeling to see if the migration is not run again (no device prompt modal = no migration)
        cy.getTestElement('@suite/menu/settings').click();
        cy.getTestElement('@settings/metadata-switch').click({ force: false });
        cy.getTestElement('@settings/metadata-switch').click({ force: true });

        // wait until migration finishes
        cy.getTestElement('@settings/metadata-switch').get('input').should('not.be.disabled');

        // check if the label is still there
        cy.getTestElement('@account-menu/btc/normal/0/label').should(
            'contain',
            'some account label',
        );
    });
});
