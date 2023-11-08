import { rerouteMetadataToMockProvider, stubOpen } from '../../stubs/metadata';

const fileName = '/f7acc942eeb83921892a95085e409b3e6b5325db6400ae5d8de523a305291dca.mtdt';
const migratedFileName =
    '/b9b5e1fd2800d4dc68e2f4e775fd819f4da3fb9e1bcc2cacd7f04fa543eac8a0_v2.mtdt';
const renamedFileName = '/f7acc942eeb83921892a95085e409b3e6b5325db6400ae5d8de523a305291dca_v1.mtdt';
const mnemonic = 'all all all all all all all all all all all all';

const provider = 'dropbox' as const;

const checkLabel = () => {
    cy.getTestElement('@suite/menu/wallet-index').click();
    cy.getTestElement('@account-menu/btc/normal/0/label').should('contain', 'some account label');
};

describe('Metadata - metadata files are properly migrated from ENCRYPTION_VERSION v1 to v2', () => {
    beforeEach(() => {
        cy.viewport(1080, 1440).resetDb();
    });

    it(`should migrate metadata file from v1 to v2 using ${provider}`, () => {
        cy.task('startEmu', { wipe: true });
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
            file: fileName,
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
        cy.task('metadataGetFilesList', { provider }).then(f => {
            const files = f as string[];
            const isFileMigrated = files.includes(migratedFileName);
            const isFileRenamed = files.includes(renamedFileName);
            expect(isFileMigrated).to.be.true;
            expect(isFileRenamed).to.be.true;
            expect(files.length).to.have.least(2); // dummies were created
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

    it(`
    complex migration case: 
     - there are files belonging to another passphrase in provider.
     - there are files belonging to the same wallet but inactive coin
    key concepts:
    - dummies: whenever migration runs dummies are created for discovered entities. as long as there are no new entities, there is no migration
    - renaming: whenever migration runs, files are renamed to _v1.mtdt, so even if previous check (dummies) does not help, we still have a small chance
                that all the files in provider were renamed and there is no need for migration

    `, () => {
        // prepare test
        cy.task('startEmu', { wipe: true });
        cy.task('setupEmu', { mnemonic });
        cy.task('startBridge');
        cy.task('metadataStartProvider', provider);

        // btc 1 account, standard wallet
        cy.task('metadataSetFileContent', {
            provider,
            file: fileName,
            content: {
                version: '1.0.0',
                accountLabel: 'some account label',
                outputLabels: {},
                addressLabels: {},
            },
            aesKey: 'c785ef250807166bffc141960c525df97647fcc1bca57f6892ca3742ba86ed8d',
        });
        // ltc 1 account, standard wallet
        cy.task('metadataSetFileContent', {
            provider,
            file: '/a0c510282f49ddc49c6bf1e887a70579016e6b902b3bcf5884c4017659db9b6a.mtdt',
            content: {
                version: '1.0.0',
                accountLabel: 'some account label litecoin',
                outputLabels: {},
                addressLabels: {},
            },
            aesKey: '9149784c6c8150c5feccb200acec79e4957abb930e77cdb7d51536eeec6e2da0',
        });

        // btc 1 account, passphrase 'a'
        cy.task('metadataSetFileContent', {
            provider,
            file: '/a54038a258caa8c7463d98c0c635593ef934731edbd5d7277d36a36b204c8b3b.mtdt',
            content: {
                version: '1.0.0',
                accountLabel: 'some account label on another passphrase',
                outputLabels: {},
                addressLabels: {},
            },
            aesKey: '5f1bddf5216b8f3439dc763640347112f904fe357845a5516bf5222e722df0c5',
        });

        cy.prefixedVisit('/accounts', {
            onBeforeLoad: (win: Window) => {
                cy.stub(win, 'open').callsFake(stubOpen(win));
                cy.stub(win, 'fetch').callsFake(rerouteMetadataToMockProvider);
            },
        });
        cy.passThroughInitialRun();
        cy.discoveryShouldFinish();

        cy.hoverTestElement("@metadata/accountLabel/m/84'/0'/0'/hover-container");
        cy.getTestElement("@metadata/accountLabel/m/84'/0'/0'/add-label-button").click();
        cy.passThroughInitMetadata(provider);
        cy.getConfirmActionOnDeviceModal();
        cy.task('pressYes');
        cy.getTestElement('@metadata/input').should('contain.text', 'some account label');

        // reloading app does not trigger migration because all discovered entities have their dummies
        cy.prefixedVisit('/accounts', {
            onBeforeLoad: (win: Window) => {
                cy.stub(win, 'open').callsFake(stubOpen(win));
                cy.stub(win, 'fetch').callsFake(rerouteMetadataToMockProvider);
            },
        });
        cy.discoveryShouldFinish();
        cy.getTestElement("@metadata/accountLabel/m/84'/0'/0'").should(
            'contain.text',
            'some account label',
        );

        // go to settings, enable litecoin, trigger migration -> labelable entities have changed, migration is triggered
        cy.getTestElement('@suite/menu/settings').click();
        cy.getTestElement('@settings/menu/wallet').click();
        cy.getTestElement('@settings/wallet/network/ltc').click();
        cy.getTestElement('@suite/menu/wallet-index').click();

        // enable labeling is triggered again, litecoin account file is migrated
        cy.getConfirmActionOnDeviceModal();
        cy.task('pressYes');
        cy.getTestElement('@account-menu/ltc/normal/0').should(
            'contain.text',
            'some account label litecoin',
        );

        // deactivate bitcoin and litecoin and activate ethereum. unfortunatelly ethereum does not have dummies
        // created yet and there is still one unmigrated file. migration is triggered again
        cy.getTestElement('@suite/menu/settings').click();
        cy.getTestElement('@settings/menu/wallet').click();
        cy.getTestElement('@settings/wallet/network/btc').click();
        cy.getTestElement('@settings/wallet/network/ltc').click();
        cy.getTestElement('@settings/wallet/network/eth').click();
        cy.wait(200); // wait for persistent db change before reload
        // note: this happnes only if user reloads app and metadata keys are lost
        // hadn't app been reloaded, it goes without metadata dialogue on device -> eth keys are derived from device master key
        cy.prefixedVisit('/accounts', {
            onBeforeLoad: (win: Window) => {
                cy.stub(win, 'open').callsFake(stubOpen(win));
                cy.stub(win, 'fetch').callsFake(rerouteMetadataToMockProvider);
            },
        });
        cy.getConfirmActionOnDeviceModal();
        cy.task('pressYes');

        // now add a new account. although number of labelable entities change
        cy.getTestElement('@account-menu/add-account').click();
        cy.getTestElement('@settings/wallet/network/eth').click();
        cy.getTestElement('@add-account').click();

        // no migration happens -> we old keys are available, so it is possible to generate old file name
        // under the hood and check for its existence in metadata provider

        // todo:
        // bug - without waiting for discovery I was able to bring suite.locks to unconsistent state.
        //       maybe getAccountInfo should be in wrapped methods too? maybe there is a bug in connect?
        cy.discoveryShouldFinish();

        // there is still one unmigrated file behind passphrase
        cy.getTestElement('@menu/switch-device').click();
        cy.getTestElement('@switch-device/add-hidden-wallet-button').click();
        cy.getConfirmActionOnDeviceModal();

        cy.task('pressYes');
        cy.getTestElement('@passphrase/input').type('a');
        cy.getTestElement('@passphrase/hidden/submit-button').click();
        cy.getTestElement('@passphrase/input').should('not.exist');
        cy.getConfirmActionOnDeviceModal();
        cy.task('pressYes');
        cy.getConfirmActionOnDeviceModal();
        cy.task('pressYes');
        cy.getTestElement('@passphrase/input').type('a');
        cy.getTestElement('@passphrase/confirm-checkbox', { timeout: 10000 }).click();
        cy.getTestElement('@passphrase/hidden/submit-button').click();
        cy.getTestElement('@passphrase/input').should('not.exist');
        cy.getConfirmActionOnDeviceModal();
        cy.task('pressYes');
        cy.wait(501);
        cy.getConfirmActionOnDeviceModal();
        cy.task('pressYes');
        cy.wait(501);

        // todo: there is probably bug in production here (probably connected with bug described above)
        // steps:
        // 1. go to account x where x is > 0
        // 2. add new empty passphrase
        // 3. you end up on accounts/coin/x which does not exist. probably it should redirect to 0
        cy.getTestElement('@account-menu/eth/normal/0').click();

        // enable labeling for hidden wallet 'a'
        cy.getConfirmActionOnDeviceModal();
        cy.task('pressYes');

        cy.hoverTestElement("@metadata/accountLabel/m/44'/60'/0'/0/0/hover-container");
        // cy.wait(2000);
        cy.getTestElement("@metadata/accountLabel/m/44'/60'/0'/0/0/add-label-button").click();
        cy.getTestElement('@metadata/input').type('and some label added to new eth account{enter}');
    });

    it('user cancels metadata on device during migration, this choice is respected for remembered wallet. migration is finished later', () => {
        // prepare test
        cy.task('startEmu', { wipe: true });
        cy.task('setupEmu', { mnemonic });
        cy.task('startBridge');
        cy.task('metadataStartProvider', provider);
        cy.task('metadataSetFileContent', {
            provider,
            file: fileName,
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

        cy.passThroughInitialRun();
        cy.getTestElement('@settings/metadata-switch').within(() => {
            cy.get('input').should('not.be.checked');
        });

        // now go to accounts. application does not try to initiate metadata
        cy.getTestElement('@suite/menu/wallet-index').click();
        cy.discoveryShouldFinish();

        // but even though metadata is disabled, on hover "add label" button appears
        cy.hoverTestElement("@metadata/accountLabel/m/84'/0'/0'/hover-container");
        cy.getTestElement("@metadata/accountLabel/m/84'/0'/0'/add-label-button").click();

        cy.passThroughInitMetadata(provider);

        // now user cancels dialogue on device
        cy.getConfirmActionOnDeviceModal();
        cy.task('pressNo');
        cy.wait(501);

        // cancelling labeling on device actually enables labeling globally so when user reloads app,
        // metadata dialogue will be propmted. this is because metadata settins is remembered, but anything related
        // to device (in this case previously cancelled dialogue) is not remembered.
        // now user cancels dialogue on device again and remembers device
        cy.prefixedVisit('/accounts', {
            onBeforeLoad: (win: Window) => {
                cy.stub(win, 'open').callsFake(stubOpen(win));
                cy.stub(win, 'fetch').callsFake(rerouteMetadataToMockProvider);
            },
        });
        cy.getConfirmActionOnDeviceModal();
        cy.task('pressNo');

        cy.getTestElement('@menu/switch-device').click();
        cy.getTestElement('@switch-device/wallet-on-index/0/toggle-remember-switch').click({
            force: true,
        });
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
        cy.getTestElement('@metadata/input').should('contain.text', 'some account label');
    });
});
