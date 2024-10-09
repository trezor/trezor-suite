import { SuiteAnalyticsEvent } from '@trezor/suite-analytics';
import { urlSearchParams } from '@trezor/suite/src/utils/suite/metadata';
import { SUITE as SuiteActions } from '@trezor/suite/src/actions/suite/constants';
import { EventPayload, Requests } from '../types';
import { onNavBar } from '../pageObjects/topBarObject';

/**
 * Shortcut to click device menu
 */
export const toggleDeviceMenu = () => cy.getTestElement('@menu/switch-device').click();

export const passThroughInitialRun = ({ viewOnly = true } = {}) => {
    cy.disableFirmwareHashCheck();
    cy.getTestElement('@analytics/continue-button', { timeout: 30_000 })
        .click()
        .getTestElement('@onboarding/exit-app-button')
        .click();
    if (viewOnly) {
        cy.getTestElement('@onboarding/viewOnly/enable').click();
    } else {
        cy.getTestElement('@onboarding/viewOnly/skip').click();
    }
    cy.getTestElement('@viewOnlyTooltip/gotIt', { timeout: 10_000 }).should('be.visible').click();
};

export const passThroughAuthenticityCheck = () => {
    // enable debug mode to allow debug keys for authenticity check
    cy.enableDebugMode();

    cy.getTestElement('@authenticity-check/start-button').click();
    cy.getTestElement('@prompts/confirm-on-device');
    cy.task('pressYes');
    cy.getTestElement('@authenticity-check/continue-button').click();
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
    cy.getTestElement('@prompts/confirm-on-device');
    cy.task('pressYes');
    cy.task('inputEmu', '1');
    cy.task('inputEmu', '1');
    cy.task('pressYes');
    cy.getTestElement('@onboarding/pin/continue-button').click();
};

export const enableDebugMode = () => {
    cy.window().then(window => {
        window.store.dispatch({
            type: SuiteActions.SET_DEBUG_MODE,
            payload: { showDebugMenu: true },
        });
    });
};

export const disableFirmwareHashCheck = () => {
    // window.store may not be ready at this point, we need to wait for app to load
    cy.getTestElement('@welcome-layout/body');
    cy.window().then(window => {
        window.store.dispatch({
            type: SuiteActions.DEVICE_FIRMWARE_HASH_CHECK,
            payload: { isDisabled: true },
        });
    });
};

export const toggleDebugModeInSettings = () => {
    const timesClickToSetDebugMode = 5;
    for (let i = 0; i < timesClickToSetDebugMode; i++) {
        cy.getTestElement('@settings/menu/title').click();
    }
};

export const enableRegtestAndGetCoins = ({ payments = [] }) => {
    onNavBar.openSettings();
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

export const createAccountFromMyAccounts = (coin: string, label: string) => {
    cy.getTestElement('@wallet/discovery-progress-bar', { timeout: 30000 }).should('not.exist');
    cy.getTestElement('@account-menu/add-account').should('be.visible').click();
    // if (cy.getTestElement('@modal').should('be.visible')) {
    //     cy.getTestElement('@account-menu/add-account').should('be.visible').click();
    // }
    cy.getTestElement('@modal').should('be.visible');
    cy.get(`[data-testid="@settings/wallet/network/${coin}"]`).should('be.visible').click();
    cy.getTestElement('@add-account-type/select/input').click();
    cy.get(`[data-testid="@add-account-type/select/option/${label}"]`).click();
    cy.getTestElement('@add-account').click();
};

export const interceptDataTrezorIo = (requests: Requests) =>
    cy.intercept({ hostname: 'data.trezor.io', url: '/suite/log/**' }, req => {
        const params = urlSearchParams(req.url);
        requests.push(params);
    });

export const findAnalyticsEventByType = <T extends SuiteAnalyticsEvent>(
    requests: Requests,
    eventType: T['type'],
): Cypress.Chainable<NonNullable<EventPayload<T>>> =>
    cy.wrap(requests).then(requestsArr => {
        const event = requestsArr.find(req => req.c_type === eventType) as EventPayload<T>;

        if (!event) {
            throw new Error(`Event with type ${eventType} not found.`);
        }

        return event;
    });

export const enterPinOnBlindMatrix = (pinEntryNumber: string) => {
    cy.task('getDebugState').then(state => {
        // TODO: export and take types from @trezor/user-env-link
        // @ts-expect-error
        const index = state.matrix.indexOf(pinEntryNumber) + 1;
        cy.getTestElement(`@pin/input/${index}`).click();
        cy.getTestElement('@pin/submit-button').click();
    });
};

export const addHiddenWallet = (passphrase: string) => {
    cy.getTestElement('@switch-device/add-hidden-wallet-button').click();
    cy.getTestElement('@passphrase/input').type(passphrase);
    cy.getTestElement('@passphrase/hidden/submit-button').click();

    cy.task('pressYes');
    cy.task('pressYes');
    cy.getTestElement('@passphrase-confirmation/step1-open-unused-wallet-button', {
        timeout: 15_000,
    }).click();
    cy.getTestElement('@passphrase-confirmation/step2-button').click();

    cy.getTestElement('@passphrase/input', { timeout: 10000 }).type(passphrase);
    cy.getTestElement('@passphrase/hidden/submit-button').click();
    cy.task('pressYes');
    cy.task('pressYes');

    cy.getTestElement('@dashboard/loading').should('not.exist');
};

export const changeViewOnlyState = (walletIndex: number, desiredState: 'enabled' | 'disabled') => {
    // get the wallet container
    cy.getTestElement(`@switch-device/wallet-on-index/${walletIndex}`).then(walletContainer => {
        // check if change is even necessary
        if (!walletContainer.find(`[data-testid="@viewOnlyStatus/${desiredState}"]`).length) {
            // if it is, open view-only settings container and change the state
            cy.wrap(walletContainer)
                .find('[data-testid="@collapsible-box/icon-collapsed"]')
                .click();
            cy.wrap(walletContainer)
                .find('[data-testid="@collapsible-box/body"]')
                .should('be.visible');
            cy.wrap(walletContainer).find(`[data-testid$="/${desiredState}"]`).click();
            // close it to match the initial state
            cy.wrap(walletContainer).find('[data-testid="@collapsible-box/icon-expanded"]').click();
        }
    });
};
