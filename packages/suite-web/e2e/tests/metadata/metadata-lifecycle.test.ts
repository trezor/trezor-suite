// @group:metadata
// @retry=2

const mnemonic = 'all all all all all all all all all all all all';

describe('Metadata - cancel metadata on device', () => {
    beforeEach(() => {
        cy.viewport(1080, 1440).resetDb();
    });

    it('user cancels metadata on device, choice is respected on subsequent runs but only for the cancelled wallet', () => {
        // prepare test
        cy.task('startEmu', { wipe: true });
        cy.task('setupEmu', {
            mnemonic,
        });
        cy.task('startBridge');
        cy.task('metadataStartProvider', 'dropbox');

        // first go to settings, see that metadata is disabled by default.
        cy.prefixedVisit('/settings');
        cy.passThroughInitialRun();
        cy.getTestElement('@settings/metadata-switch').within(() => {
            cy.get('input').should('not.be.checked');
        });

        // now go to accounts. application does not try to initiate metadata
        cy.getTestElement('@suite/menu/suite-index').click();
        cy.discoveryShouldFinish();
        cy.getTestElement('@account-menu/btc/normal/0').click();

        // but even though metadata is disabled, on hover "add label" button appears
        cy.hoverTestElement("@metadata/accountLabel/m/84'/0'/0'/hover-container");
        cy.getTestElement("@metadata/accountLabel/m/84'/0'/0'/add-label-button").click();

        // now user cancels dialogue on device
        cy.getConfirmActionOnDeviceModal();
        cy.task('pressNo');
        cy.wait(501);

        // cancelling labeling on device actually enables labeling globally so when user reloads app,
        // metadata dialogue will be propmted. now user cancels dialogue on device again and remembers device
        cy.reload();
        cy.getConfirmActionOnDeviceModal();
        cy.task('pressNo');
        cy.getTestElement('@menu/switch-device').click();
        cy.getTestElement('@switch-device/wallet-on-index/0/toggle-remember-switch').click({
            force: true,
        });
        cy.wait(200); // wait for db write to finish :( sad
        cy.reload();
        cy.discoveryShouldFinish(); // no dialogue!

        // but when user tries to add another wallet, there is enable labeling dialogue again
        cy.getTestElement('@menu/switch-device').click();
        cy.getTestElement('@switch-device/add-hidden-wallet-button').click();
        cy.getConfirmActionOnDeviceModal();
        cy.task('pressYes');
        cy.getTestElement('@passphrase/input').type('abc');
        cy.getTestElement('@passphrase/hidden/submit-button').click();
        cy.getTestElement('@passphrase/input').should('not.exist');
        cy.getConfirmActionOnDeviceModal();
        cy.task('pressYes');
        cy.getConfirmActionOnDeviceModal();
        cy.task('pressYes');
        cy.getTestElement('@passphrase/input').type('abc');
        cy.getTestElement('@passphrase/confirm-checkbox', { timeout: 10000 }).click();
        cy.getTestElement('@passphrase/hidden/submit-button').click();
        cy.getTestElement('@passphrase/input').should('not.exist');
        cy.getConfirmActionOnDeviceModal();
        cy.task('pressYes');
        cy.wait(501);
        cy.getConfirmActionOnDeviceModal();
        cy.task('pressYes');
        cy.wait(501);
        cy.getConfirmActionOnDeviceModal(); // <--- this is enable labeling dialogue
        cy.task('pressNo');
        cy.getTestElement('@accounts/empty-account/receive');

        // unremember device and reload -> enable labeling dialogue appers
        // explanation: metadata.error is index by device.state and we treat this field as sensitive
        // as keeping it might beat users pluasible deniability
        cy.getTestElement('@menu/switch-device').click();
        cy.getTestElement('@switch-device/wallet-on-index/0/toggle-remember-switch').click({
            force: true,
        });
        cy.wait(200); // wait for db write to finish :( sad
        cy.reload();
        cy.getTestElement('@passphrase-type/standard').click();
        cy.getConfirmActionOnDeviceModal();
        cy.task('pressNo');
    });
});

export {};
