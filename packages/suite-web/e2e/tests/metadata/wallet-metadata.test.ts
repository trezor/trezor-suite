// @group_metadata
// @retry=2

import { rerouteMetadataToMockProvider, stubOpen } from '../../stubs/metadata';
import { MetadataProvider } from '../../support/enums/metadataProvider';
import { onAccountsPage } from '../../support/pageObjects/accountsObject';
import { onMenu } from '../../support/pageObjects/menuObject';
import { onSwitchDeviceModal } from '../../support/pageObjects/switchDeviceObject';

const firmwares = ['2.3.0', '2-main'] as const;

const standardWalletIndex = 0;
const hiddenWalletIndex = 1;

function openApp(): void {
    cy.prefixedVisit('/', {
        onBeforeLoad: (win: Window) => {
            cy.stub(win, 'open').callsFake(stubOpen(win));
            cy.stub(win, 'fetch').callsFake(rerouteMetadataToMockProvider);
        },
    });
}

function handleLabelingOnDevice(action: 'pressYes' | 'pressNo'): void {
    cy.getConfirmActionOnDeviceModal();
    cy.wait(501);
    cy.task(action);
}

function checkStateNotificationsForErrors(): void {
    cy.window()
        .its('store')
        .invoke('getState')
        .then(state => {
            console.log(state);
            const errors = state.notifications.filter((n: { type: string }) => n.type === 'error');

            return expect(errors).to.be.empty;
        });
}

describe('Metadata - wallet labeling', () => {
    beforeEach(() => {
        cy.viewport('macbook-13').resetDb();
        cy.task('startEmu', { wipe: true });
        cy.task('setupEmu', {
            mnemonic: 'mnemonic_all',
            passphrase_protection: true,
        });
        cy.task('startBridge');
        cy.task('metadataStartProvider', MetadataProvider.Dropbox);

        openApp();

        cy.passThroughInitialRun();
        cy.discoveryShouldFinish();
    });

    firmwares.forEach(firmware => {
        describe(firmware, () => {
            it('persists wallet labels', () => {
                cy.step('Setup standard wallet with label and edit it', () => {
                    onAccountsPage.openBtcAccount(1);
                    onMenu.openSwitchDevice();

                    onSwitchDeviceModal.clickAddLabel(standardWalletIndex);
                    cy.passThroughInitMetadata(MetadataProvider.Dropbox);
                    onSwitchDeviceModal.typeLabel('label for standard wallet');

                    onSwitchDeviceModal.clickEditLabel(standardWalletIndex);
                    onSwitchDeviceModal.typeLabel('wallet for drugs');
                });

                cy.step('Add hidden wallet and enable labeling', () => {
                    cy.addHiddenWallet('abc');
                    onMenu.openSwitchDevice();
                    handleLabelingOnDevice('pressYes');
                    onSwitchDeviceModal.clickAddLabel(hiddenWalletIndex);
                    onSwitchDeviceModal.typeLabel('wallet not for drugs');
                });

                cy.step('Verify wallet labels', () => {
                    onSwitchDeviceModal
                        .getLabel(standardWalletIndex)
                        .should('contain', 'wallet for drugs');

                    onSwitchDeviceModal
                        .getLabel(hiddenWalletIndex)
                        .should('contain', 'wallet not for drugs');
                });

                cy.step('Remember wallet and reload app,', () => {
                    cy.changeViewOnlyState(1, 'enabled');

                    cy.wait(1000); // wait for changes to db
                    openApp();
                });

                cy.step('Verify wallet labels after reload', () => {
                    onMenu.openSwitchDevice();
                    onSwitchDeviceModal
                        .getLabel(standardWalletIndex)
                        .should('contain', 'wallet for drugs');

                    onSwitchDeviceModal
                        .getLabel(hiddenWalletIndex)
                        .should('contain', 'wallet not for drugs');
                });

                checkStateNotificationsForErrors();
            });

            it('labels can be enabled and edited when different wallet is open', () => {
                cy.step('Setup standard wallet with label and edit it', () => {
                    onAccountsPage.openBtcAccount(1);
                    onMenu.openSwitchDevice();

                    onSwitchDeviceModal.clickAddLabel(standardWalletIndex);
                    cy.passThroughInitMetadata(MetadataProvider.Dropbox);
                    onSwitchDeviceModal.typeLabel('label for standard wallet');
                });

                cy.step('Add passphrase wallet C and switch back to first wallet', () => {
                    cy.addHiddenWallet('C');
                    onMenu.openSwitchDevice();
                    handleLabelingOnDevice('pressNo');
                    onSwitchDeviceModal.openDevice(standardWalletIndex);
                });

                cy.step('Enable labeling for wallet C', () => {
                    onMenu.openSwitchDevice();
                    onSwitchDeviceModal.clickAddLabel(hiddenWalletIndex);

                    handleLabelingOnDevice('pressYes');
                    onSwitchDeviceModal.typeLabel(
                        'still works, metadata enabled for currently not selected device',
                    );
                });

                cy.step('Verify wallet label', () => {
                    onSwitchDeviceModal
                        .getLabel(hiddenWalletIndex)
                        .should(
                            'contain',
                            'still works, metadata enabled for currently not selected device',
                        );
                });

                checkStateNotificationsForErrors();
            });
        });
    });
});

export {};
