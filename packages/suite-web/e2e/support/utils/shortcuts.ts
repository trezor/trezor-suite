/**
 * Shortcut to click device menu
 */
export const toggleDeviceMenu = () => cy.getTestElement('@menu/switch-device').click();

export const passThroughInitialRun = () => {
    cy.getTestElement('@onboarding/continue-button', { timeout: 40000 })
        .click()
        .getTestElement('@onboarding/exit-app-button')
        .click()
        .getTestElement('@suite/loading')
        .should('not.exist');
};

export const passThroughBackup = () => {
    // todo: much of commented out code probably stays in standalone backup?
    cy.log('Backup button should be disabled until all checkboxes are checked');
    cy.getTestElement('@backup/start-button').should('be.disabled');

    cy.getTestElement('@backup/check-item/wrote-seed-properly').click();
    cy.getTestElement('@backup/check-item/made-no-digital-copy').click();
    cy.getTestElement('@backup/check-item/will-hide-seed').click();

    cy.log('Create backup on device');
    cy.getTestElement('@backup/start-button').click();
    // cy.getConfirmActionOnDeviceModal();
    cy.getTestElement('@onboarding/confirm-on-device');
    cy.task('readAndConfirmMnemonicEmu');

    cy.getTestElement('@backup/close-button').click();
};

export const passThroughBackupShamir = (shares: number, threshold: number) => {
    cy.log('Backup button should be disabled until all checkboxes are checked');
    cy.getTestElement('@backup/start-button').should('be.disabled');

    cy.getTestElement('@backup/check-item/wrote-seed-properly').click();
    cy.getTestElement('@backup/check-item/made-no-digital-copy').click();
    cy.getTestElement('@backup/check-item/will-hide-seed').click();

    cy.log('Create Shamir backup on device');
    cy.getTestElement('@backup/start-button').click();
    cy.getTestElement('@onboarding/confirm-on-device');
    cy.task('readAndConfirmShamirMnemonicEmu', { shares, threshold });

    cy.getTestElement('@backup/close-button').click();
};

export const passThroughInitMetadata = (provider: 'dropbox' | 'google') => {
    cy.getConfirmActionOnDeviceModal();
    cy.task('pressYes');
    cy.getTestElement(`@modal/metadata-provider/${provider}-button`).click();
    cy.getTestElement('@modal/metadata-provider').should('not.exist');
};

export const passThroughSetPin = () => {
    cy.getTestElement('@onboarding/set-pin-button').click();
    cy.getTestElement('@suite/modal/confirm-action-on-device');
    cy.task('pressYes');
    cy.task('inputEmu', '1');
    cy.task('inputEmu', '1');
    cy.task('pressYes');
    cy.getTestElement('@onboarding/pin/continue-button').click();
};

export const toggleDebugModeInSettings = () => {
    const timesClickToSetDebugMode = 5;
    for (let i = 0; i < timesClickToSetDebugMode; i++) {
        cy.getTestElement('@settings/menu/title').click();
    }
};

export const enableRegtestAndGetCoins = ({ payments = [] }) => {
    cy.getTestElement('@suite/menu/settings').click();
    cy.getTestElement('@settings/menu/wallet').click();

    cy.toggleDebugModeInSettings();

    cy.getTestElement('@settings/wallet/network/regtest').click({ force: true });

    // send 1 regtest bitcoin to first address in the derivation path
    payments.forEach(payment => {
        cy.task('sendToAddressAndMineBlock', {
            // @ts-expect-error
            address: payment.address,
            // @ts-expect-error
            btc_amount: payment.amount,
        });
    });
    cy.task('mineBlocks', { block_amount: 1 });
};

export const createAccountFromMyAccounts = (coin: string, accountNameAdd: string) => {
    cy.getTestElement('@wallet/discovery-progress-bar', { timeout: 30000 }).should('not.exist');
    cy.getTestElement('@account-menu/add-account').should('be.visible').click();
    // if (cy.getTestElement('@modal').should('be.visible')) {
    //     cy.getTestElement('@account-menu/add-account').should('be.visible').click();
    // }
    cy.getTestElement('@modal').should('be.visible');
    cy.get(`[data-test="@settings/wallet/network/${coin}"]`).should('be.visible').click();
    cy.getTestElement('@add-account-type/select/input').click();
    cy.get(`[data-test="@add-account-type/select/option/${accountNameAdd}"]`).click();
    cy.getTestElement('@add-account').click();
};
