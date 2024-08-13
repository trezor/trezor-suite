// @group_metadata
// @retry=2

const mnemonic = 'all all all all all all all all all all all all';

describe('Metadata - cancel metadata on device', () => {
    beforeEach(() => {
        cy.viewport('macbook-15').resetDb();
    });

    it('user cancels metadata on device, choice is respected on subsequent runs but only for the cancelled wallet', () => {
        // prepare test
        cy.task('startEmu', { wipe: true, version: '2.7.0' });
        cy.task('setupEmu', {
            mnemonic,
            passphrase_protection: true,
        });
        cy.task('startBridge');
        cy.task('metadataStartProvider', 'dropbox');

        // first go to settings, see that metadata is disabled by default.
        cy.prefixedVisit('/');
        cy.passThroughInitialRun({ viewOnly: false });
        cy.discoveryShouldFinish();
        cy.getTestElement('@suite/menu/settings').click();
        cy.getTestElement('@settings/metadata-switch').within(() => {
            cy.get('input').should('not.be.checked');
        });

        // now go to accounts. application does not try to initiate metadata
        cy.getTestElement('@suite/menu/suite-index').click();
        cy.getTestElement('@account-menu/btc/normal/0').click();
        Cypress.config('scrollBehavior', false);
        // but even though metadata is disabled, on hover "add label" button appears
        cy.hoverTestElement("@metadata/accountLabel/m/84'/0'/0'/hover-container");

        // try to init metadata...
        cy.getTestElement("@metadata/accountLabel/m/84'/0'/0'/add-label-button").click({
            force: true,
        });
        Cypress.config('scrollBehavior', 'top');
        // ...but user cancels dialogue on device
        cy.getConfirmActionOnDeviceModal();
        cy.task('pressNo');
        cy.wait(501);

        // cancelling labeling on device actually enables labeling globally so when user reloads app,
        // metadata dialogue will be prompted. now user cancels dialogue on device again and remembers device

        cy.safeReload();
        // todo: this may timeout

        cy.getConfirmActionOnDeviceModal();
        cy.task('pressNo');

        // set wallet to remembered
        cy.getTestElement('@menu/switch-device').click();
        cy.getTestElement('@viewOnlyStatus/disabled').click();
        cy.getTestElement('@viewOnly/radios/enabled').click();
        cy.safeReload();
        cy.discoveryShouldFinish(); // no dialogue, metadata keys survive together with remembered wallet!

        // but when user tries to add another wallet, there is enable labeling dialogue again
        cy.getTestElement('@menu/switch-device').click();
        cy.getTestElement('@switch-device/add-hidden-wallet-button').click();
        cy.getTestElement('@passphrase/input').type('abc');
        cy.getTestElement('@passphrase/hidden/submit-button').click();
        cy.getTestElement('@passphrase/input').should('not.exist');
        cy.getConfirmActionOnDeviceModal();
        cy.task('pressYes');
        cy.getConfirmActionOnDeviceModal();
        cy.task('pressYes');
        cy.getTestElement('@passphrase-confirmation/step1-open-unused-wallet-button').click();
        cy.getTestElement('@passphrase-confirmation/step2-button').click();
        cy.getTestElement('@passphrase/input').type('abc');
        cy.getTestElement('@passphrase/hidden/submit-button').click();
        cy.task('pressYes');
        cy.task('pressYes');
        cy.getTestElement('@passphrase/input').should('not.exist');
        cy.getConfirmActionOnDeviceModal();
        cy.task('pressYes');
        cy.wait(501);
        cy.getConfirmActionOnDeviceModal();
        cy.task('pressYes');
        cy.wait(501);

        // connect to data provider modal
        // note: since recently, the first dialogue that appeared was "enable labeling on device" are we ok with this change of order?
        cy.getTestElement('@modal/close-button').click();

        // cy.getConfirmActionOnDeviceModal();
        // cy.task('pressNo');
        // cy.wait(501);

        cy.getTestElement('@accounts/empty-account/receive');

        // forget device and reload -> enable labeling dialogue appears
        // explanation: metadata.error is indexed by device.state and we treat this field as sensitive
        // as keeping it might beat users plausible deniability
        cy.getTestElement('@menu/switch-device').click();

        cy.getTestElement('@switch-device/wallet-on-index/0/eject-button').click();
        cy.getTestElement('@switch-device/eject').click();
        cy.getTestElement('@switch-device/wallet-on-index/0/eject-button').click();
        cy.getTestElement('@switch-device/eject').click();

        cy.safeReload();

        cy.getConfirmActionOnDeviceModal(); // enable labeling dialogue;
        cy.task('pressNo');
    });
});

export {};
