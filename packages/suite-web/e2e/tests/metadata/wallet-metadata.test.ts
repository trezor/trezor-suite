// @group_metadata
// @retry=0

import { rerouteMetadataToMockProvider, stubOpen } from '../../stubs/metadata';

const firmwares = ['2.2.0', '2-main'] as const;
const provider = 'dropbox';

const mnemonic = 'all all all all all all all all all all all all';
// state corresponding to all seed
const standardWalletState = 'mvbu1Gdy8SUjTenqerxUaZyYjmveZvt33q@355C817510C0EABF2F147145:1';
// state corresponding to "wallet for drugs"
const firstHiddenWalletState = 'myBrmyzvN5Wa4oeYrL7t8EYU1Ch5Q6vp47@355C817510C0EABF2F147145:2';
// state corresponding to "C"
const secondHiddenWalletState = 'mkx2Uqi3fmLHh8AHpQvAErTM3MZpzrmFr2@355C817510C0EABF2F147145:3';
describe.skip('Metadata - wallet labeling', () => {
    beforeEach(() => {
        cy.viewport(1440, 2560).resetDb();
    });

    firmwares.forEach(firmware => {
        it(firmware, () => {
            // prepare test
            cy.task('startEmu', { wipe: true });
            cy.task('setupEmu', {
                mnemonic,
                passphrase_protection: true,
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

            cy.addHiddenWallet('abc');

            cy.log(
                'discovering new passphrase -> new deviceState -> we need new metadata master key',
            );
            // cy.getConfirmActionOnDeviceModal();
            // cy.task('pressYes');
            // cy.getConfirmActionOnDeviceModal();
            // cy.wait(501);
            // cy.task('pressYes');
            cy.getTestElement('@menu/switch-device').click();
            // cy.getConfirmActionOnDeviceModal();

            cy.wait(501);
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
            // cy.getTestElement('@switch-device/wallet-on-index/1/toggle-remember-switch').click({
            //     force: true,
            // });
            cy.changeViewOnlyState(1, 'enabled');

            cy.wait(1000); // wait for changes to db
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
            cy.addHiddenWallet('C');
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
