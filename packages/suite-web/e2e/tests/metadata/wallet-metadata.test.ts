// @group:metadata
// @retry=2

import { rerouteMetadataToMockProvider, stubOpen } from '../../stubs/metadata';

const firmwares = ['2.2.0', '2-main'] as const;
const provider = 'dropbox';

const mnemonic = 'all all all all all all all all all all all all';
// state corresponding to all seed
const standardWalletState = 'mvbu1Gdy8SUjTenqerxUaZyYjmveZvt33q@355C817510C0EABF2F147145:0';
// state corresponding to "wallet for drugs"
const firstHiddenWalletState = 'myBrmyzvN5Wa4oeYrL7t8EYU1Ch5Q6vp47@355C817510C0EABF2F147145:1';
// state corresponding to "C"
const secondHiddenWalletState = 'mkx2Uqi3fmLHh8AHpQvAErTM3MZpzrmFr2@355C817510C0EABF2F147145:2';

describe('Metadata - wallet labeling', () => {
    beforeEach(() => {
        cy.viewport(1080, 1440).resetDb();
    });

    firmwares.forEach(firmware => {
        it(firmware, () => {
            // prepare test
            cy.task('startEmu', { wipe: true });
            cy.task('setupEmu', {
                mnemonic,
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

            cy.getTestElement('@menu/switch-device').click();
            cy.getTestElement(
                `@metadata/walletLabel/${standardWalletState}/add-label-button`,
            ).click({
                force: true,
            });
            cy.passThroughInitMetadata(provider);
            cy.getTestElement('@metadata/input').type('label for standard wallet{enter}');

            cy.wait(2001);
            cy.getTestElement(
                `@metadata/walletLabel/${standardWalletState}/edit-label-button`,
            ).click({
                force: true,
            });
            cy.getTestElement('@metadata/input').clear().type('wallet for drugs{enter}');

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

            cy.getTestElement('@passphrase/input', { timeout: 30000 }).type('abc');
            cy.getTestElement('@passphrase/confirm-checkbox').click();
            cy.getTestElement('@passphrase/hidden/submit-button').click();

            cy.getTestElement('@modal').should('not.exist');

            cy.log(
                'discovering new passphrase -> new deviceState -> we need new metadata master key',
            );
            cy.getConfirmActionOnDeviceModal();
            cy.task('pressYes');
            cy.getConfirmActionOnDeviceModal();
            cy.task('pressYes');
            cy.getTestElement('@menu/switch-device').click();
            cy.getConfirmActionOnDeviceModal();
            cy.task('pressYes');
            cy.getTestElement(`@metadata/walletLabel/${standardWalletState}`).should(
                'contain',
                'wallet for drugs',
            );

            // focus lock? :(
            cy.getTestElement(
                `@metadata/walletLabel/${firstHiddenWalletState}/add-label-button`,
            ).click({
                force: true,
            });
            cy.getTestElement('@metadata/input').type('wallet not for drugs{enter}');
            cy.getTestElement(`@metadata/walletLabel/${firstHiddenWalletState}`).should(
                'contain',
                'wallet not for drugs',
            );

            // remember wallet, reload app, and observe that labels were loaded
            // https://github.com/trezor/trezor-suite/pull/9560
            cy.getTestElement('@switch-device/wallet-on-index/0/toggle-remember-switch').click({
                force: true,
            });
            cy.getTestElement('@switch-device/wallet-on-index/1/toggle-remember-switch').click({
                force: true,
            });
            cy.wait(200); // wait for data to save to persistent storage. currently this is not reflected in UI
            cy.prefixedVisit('/', {
                onBeforeLoad: (win: Window) => {
                    cy.stub(win, 'open').callsFake(stubOpen(win));
                    cy.stub(win, 'fetch').callsFake(rerouteMetadataToMockProvider);
                },
            });
            cy.getTestElement('@menu/switch-device').click();
            cy.getTestElement(`@metadata/walletLabel/${standardWalletState}`).should(
                'contain',
                'wallet for drugs',
            );
            cy.getTestElement(`@metadata/walletLabel/${firstHiddenWalletState}`).should(
                'contain',
                'wallet not for drugs',
            );

            // add another passphrase wallet C, have selected passphrase wallet A, try to enable
            // labeling for wallet C
            cy.getTestElement('@switch-device/add-hidden-wallet-button').click();
            cy.getTestElement('@passphrase/input').type('C');
            cy.getTestElement('@passphrase/hidden/submit-button').click();
            cy.getTestElement('@passphrase/input').should('not.exist');
            cy.getConfirmActionOnDeviceModal();
            cy.task('pressYes');
            cy.getConfirmActionOnDeviceModal();
            cy.task('pressYes');
            cy.getTestElement('@passphrase/input', { timeout: 30000 }).type('C');
            cy.getTestElement('@passphrase/confirm-checkbox').click();
            cy.getTestElement('@passphrase/hidden/submit-button').click();
            cy.getTestElement('@modal').should('not.exist');
            cy.getConfirmActionOnDeviceModal();
            cy.task('pressYes');
            cy.getConfirmActionOnDeviceModal();
            cy.task('pressYes');
            cy.getTestElement('@menu/switch-device').click();
            cy.getConfirmActionOnDeviceModal();
            cy.task('pressNo'); // labeling was not enabled at this moment
            // select previous wallet
            cy.getTestElement('@switch-device/wallet-on-index/1').click();
            cy.getTestElement('@menu/switch-device').click();
            cy.hoverTestElement(`@metadata/walletLabel/${secondHiddenWalletState}/hover-container`);
            cy.getTestElement(
                `@metadata/walletLabel/${secondHiddenWalletState}/add-label-button`,
            ).click();
            cy.getConfirmActionOnDeviceModal();
            cy.task('pressYes'); // only now labeling was enabled
            cy.getTestElement('@metadata/input').type(
                'still works, metadata enabled for currently not selected device{enter}',
            );

            cy.window()
                .its('store')
                .invoke('getState')
                .then(state => {
                    console.log(state);
                    const errors = state.notifications.filter(
                        (n: { type: string }) => n.type === 'error',
                    );
                    return expect(errors).to.be.empty;
                });
        });
    });
});

export {};
