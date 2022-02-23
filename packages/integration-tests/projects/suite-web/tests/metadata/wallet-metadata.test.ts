// @group:metadata
// @retry=2

import { rerouteMetadataToMockProvider, stubOpen } from '../../stubs/metadata';

const firmwares = ['2.2.0', '2-master'] as const;
const provider = 'dropbox';

const mnemonic = 'all all all all all all all all all all all all';
// state corresponding to all seed
const standardWalletState = 'mvbu1Gdy8SUjTenqerxUaZyYjmveZvt33q@355C817510C0EABF2F147145:undefined';
// state corresponding to "wallet for drugs"
const firstHiddenWalletState = 'myBrmyzvN5Wa4oeYrL7t8EYU1Ch5Q6vp47@355C817510C0EABF2F147145:1';

describe('Metadata - wallet labeling', () => {
    beforeEach(() => {
        cy.viewport(1024, 768).resetDb();
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
            cy.getTestElement('@suite/menu/wallet-index').click();

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
