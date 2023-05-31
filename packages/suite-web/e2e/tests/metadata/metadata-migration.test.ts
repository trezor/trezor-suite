import { rerouteMetadataToMockProvider, stubOpen } from '../../stubs/metadata';

const providers = ['google', 'dropbox'] as const;

const fileName = 'f7acc942eeb83921892a95085e409b3e6b5325db6400ae5d8de523a305291dca.mtdt';
const migratedFileName = 'b9b5e1fd2800d4dc68e2f4e775fd819f4da3fb9e1bcc2cacd7f04fa543eac8a0_v2.mtdt';

const fileLocation = {
    google: fileName,
    dropbox: `/apps/trezor/${fileName}`,
};

const checkLabel = () => {
    cy.getTestElement('@suite/menu/wallet-index').click();
    cy.getTestElement('@account-menu/btc/normal/0/label').should('contain', 'some account label');
};

describe('Metadata - metadata files are properly migrated from ENCRYPTION_VERSION v1 to v2', () => {
    beforeEach(() => {
        cy.viewport(1080, 1440).resetDb();
        cy.task('startEmu', { wipe: true });
        cy.task('setupEmu', {
            mnemonic: 'all all all all all all all all all all all all',
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
    });

    providers.forEach(provider => {
        it(`should migrate metadata file from v1 to v2 using ${provider}`, () => {
            // initialize provider
            cy.task('metadataStartProvider', provider);
            cy.task('metadataSetFileContent', {
                provider,
                file: fileLocation[provider],
                content: {
                    version: '1.0.0',
                    accountLabel: 'some account label',
                    outputLabels: {},
                    addressLabels: {},
                },
                aesKey: 'c785ef250807166bffc141960c525df97647fcc1bca57f6892ca3742ba86ed8d',
            });

            // enable labeling
            cy.getTestElement('@settings/metadata-switch').click({ force: true });
            cy.passThroughInitMetadata(provider);

            // appears only when a migration is needed
            cy.getConfirmActionOnDeviceModal();
            cy.task('pressYes');

            // wait until migration finishes
            cy.getTestElement('@settings/metadata-switch').get('input').should('not.be.disabled');

            // check if the file has been migrated
            cy.task('metadataGetFilesList', { provider }).then(files => {
                const isFileMigrated = (files as string[]).includes(migratedFileName);
                expect(isFileMigrated).to.be.true;
            });

            // check if the label is there after migration
            checkLabel();

            // toggle labeling to see if the migration is not run again (no device prompt modal = no migration)
            cy.getTestElement('@suite/menu/settings').click();
            cy.getTestElement('@settings/metadata-switch').click({ force: false });
            cy.getTestElement('@settings/metadata-switch').click({ force: true });

            // wait until migration finishes
            cy.getTestElement('@settings/metadata-switch').get('input').should('not.be.disabled');

            // check if the label is still there
            checkLabel();
        });
    });
});
