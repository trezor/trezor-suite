// @group_metadata

import { rerouteMetadataToMockProvider, stubOpen } from '../../stubs/metadata';

const originalFileName = '/f7acc942eeb83921892a95085e409b3e6b5325db6400ae5d8de523a305291dca.mtdt';
const mnemonic = 'all all all all all all all all all all all all';

const provider = 'dropbox' as const;

describe('Metadata - metadata files are properly migrated from ENCRYPTION_VERSION v1 to v2', () => {
    beforeEach(() => {
        cy.viewport(1080, 1440).resetDb();
    });

    it('user cancels metadata on device during migration, this choice is respected for remembered wallet. migration is finished later', () => {
        // prepare test
        cy.task('startEmu', { wipe: true, version: '2.7.0' });
        cy.task('setupEmu', { mnemonic });
        cy.task('startBridge');
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

        // first go to settings, see that metadata is disabled by default.
        cy.prefixedVisit('/settings', {
            onBeforeLoad: (win: Window) => {
                cy.stub(win, 'open').callsFake(stubOpen(win));
                cy.stub(win, 'fetch').callsFake(rerouteMetadataToMockProvider);
            },
        });
        cy.getTestElement('@analytics/continue-button', { timeout: 30_000 }).click();
        cy.getTestElement('@onboarding/exit-app-button').click();

        // enable encryption v2 through experimental features
        cy.enableDebugMode();
        cy.getTestElement('@settings/experimental-switch').click({ force: true });
        cy.getTestElement('@experimental-feature/confirm-less-labeling/checkbox').click();

        // metadata is off
        cy.getTestElement('@settings/metadata-switch').within(() => {
            cy.get('input').should('not.be.checked');
        });

        // now go to accounts. application does not try to initiate metadata
        cy.getTestElement('@suite/menu/suite-index').click();
        cy.getTestElement('@onbarding/viewOnly/skip').click();
        cy.getTestElement('@viewOnlyTooltip/gotIt').click();
        cy.getTestElement('@account-menu/btc/normal/0').click();
        cy.discoveryShouldFinish();

        // but even though metadata is disabled, on hover "add label" button appears
        cy.hoverTestElement("@metadata/accountLabel/m/84'/0'/0'/hover-container");
        cy.getTestElement("@metadata/accountLabel/m/84'/0'/0'/add-label-button").click();

        cy.getTestElement(`@modal/metadata-provider/${provider}-button`).click();
        cy.getTestElement('@modal/metadata-provider').should('not.exist');

        // now user cancels dialogue on device
        cy.getConfirmActionOnDeviceModal();
        cy.task('pressNo');
        cy.wait(501);

        // cancelling labeling on device actually enables labeling globally so when user reloads app,
        // metadata dialogue will be prompted. this is because metadata settings is remembered, but anything related
        // to device which was not remembered (in this case previously cancelled dialogue) is not remembered.
        // now user cancels dialogue on device again and remembers device
        cy.prefixedVisit('/accounts', {
            onBeforeLoad: (win: Window) => {
                cy.stub(win, 'open').callsFake(stubOpen(win));
                cy.stub(win, 'fetch').callsFake(rerouteMetadataToMockProvider);
            },
        });
        cy.discoveryShouldFinish();

        cy.getConfirmActionOnDeviceModal(); // <-- enable labeling dialogue
        cy.task('pressNo');

        // set device to remembered
        cy.getTestElement('@menu/switch-device').click();
        cy.getTestElement('@viewOnlyStatus/disabled').click();
        cy.getTestElement('@viewOnly/radios/enabled').click();
        cy.wait(200); // wait for db write to finish :( sad

        // after reload, no metadata dialogue (cancel choice from previous run is now remembered)
        cy.prefixedVisit('/accounts', {
            onBeforeLoad: (win: Window) => {
                cy.stub(win, 'open').callsFake(stubOpen(win));
                cy.stub(win, 'fetch').callsFake(rerouteMetadataToMockProvider);
            },
        });
        cy.getTestElement('@deviceStatus-connected');

        // now user manually triggers enable metadata. migration should run and finish successfully
        cy.hoverTestElement("@metadata/accountLabel/m/84'/0'/0'/hover-container");
        cy.getTestElement("@metadata/accountLabel/m/84'/0'/0'/add-label-button").click();
        cy.getConfirmActionOnDeviceModal();
        cy.task('pressYes');

        // now v1 encryption file is migrated, and its value displays in metadata input, yupi
        cy.getTestElement('@metadata/input').should('have.value', 'some account label');
    });
});
