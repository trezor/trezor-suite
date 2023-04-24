// @group:onboarding
// @retry=2

import { DeviceModel } from '@trezor/device-utils';

const navigateToSettingsAndBack = () => {
    cy.getTestElement('@analytics/consent');
    cy.getTestElement('@suite/menu/settings').click();
    cy.getTestElement('@settings/menu/close').click();
};

const acceptAnalyticsConsentOnNonInitializedDevice = () => {
    cy.getTestElement('@analytics/consent');
    cy.getTestElement('@analytics/continue-button').click();
    cy.getTestElement('@analytics/continue-button').click();
};

const acceptAnalyticsConsentOnInitializedDevice = () => {
    cy.getTestElement('@analytics/consent');
    cy.getTestElement('@analytics/continue-button').click();
    cy.getTestElement('@onboarding/exit-app-button').click();
};

describe('Onboarding - analytics consent', () => {
    const startEmuOpts = {
        url: 'https://gitlab.com/satoshilabs/trezor/trezor-firmware/-/jobs/3104755066/artifacts/raw/core/build/unix/trezor-emu-core',
        model: DeviceModel.T2B1,
        wipe: true,
    };

    beforeEach(() => {
        cy.task('startBridge');
        cy.viewport(1080, 1440).resetDb();
    });

    it('shows analytics consent when going to settings and back on non-initialized T1 device', () => {
        cy.task('startEmu', { version: '1-latest', wipe: true });
        cy.prefixedVisit('/');

        navigateToSettingsAndBack();
        acceptAnalyticsConsentOnNonInitializedDevice();

        cy.getTestElement('@onboarding-layout/body').should('be.visible');
    });

    it('shows analytics consent when going to settings and back on non-initialized TT device', () => {
        cy.task('startEmu', { wipe: true });
        cy.prefixedVisit('/');

        navigateToSettingsAndBack();
        acceptAnalyticsConsentOnNonInitializedDevice();

        cy.getTestElement('@onboarding-layout/body').should('be.visible');
    });

    it('shows analytics consent when going to settings and back on non-initialized T2B1 device', () => {
        cy.task('startEmuFromUrl', startEmuOpts);
        cy.prefixedVisit('/');

        navigateToSettingsAndBack();
        acceptAnalyticsConsentOnNonInitializedDevice();

        cy.getTestElement('@onboarding-layout/body').should('be.visible');
    });

    it('shows analytics consent when going to settings and back on initialized T1 device', () => {
        cy.task('startEmu', { version: '1-latest', wipe: true });
        cy.task('setupEmu', {
            needs_backup: false,
        });
        cy.prefixedVisit('/');

        navigateToSettingsAndBack();
        acceptAnalyticsConsentOnInitializedDevice();

        cy.getTestElement('@suite-layout/body').should('be.visible');
        cy.getTestElement('@settings/menu/close').should('be.visible');
    });

    it('shows analytics consent when going to settings and back on initialized TT device', () => {
        cy.task('startEmu', { wipe: true });
        cy.task('setupEmu', {
            needs_backup: false,
        });
        cy.prefixedVisit('/');

        navigateToSettingsAndBack();
        acceptAnalyticsConsentOnInitializedDevice();

        cy.getTestElement('@suite-layout/body').should('be.visible');
        cy.getTestElement('@settings/menu/close').should('be.visible');
    });

    it('shows analytics consent when going to settings and back on initialized T2B1 device', () => {
        cy.task('startEmuFromUrl', startEmuOpts);
        cy.task('setupEmu', {
            needs_backup: false,
        });
        cy.prefixedVisit('/');

        navigateToSettingsAndBack();
        acceptAnalyticsConsentOnInitializedDevice();

        cy.getTestElement('@suite-layout/body').should('be.visible');
        cy.getTestElement('@settings/menu/close').should('be.visible');
    });

    it('shows analytics consent and then goes to /accounts on initialized T1 device', () => {
        cy.task('startEmu', { version: '1-latest', wipe: true });
        cy.task('setupEmu', {
            needs_backup: false,
        });
        cy.prefixedVisit('/accounts');

        acceptAnalyticsConsentOnInitializedDevice();

        cy.getTestElement('@suite-layout/body').should('be.visible');
        cy.getTestElement('@wallet/menu/wallet-send');
    });

    it('shows analytics consent and then goes to /accounts on initialized TT device', () => {
        cy.task('startEmu', { wipe: true });
        cy.task('setupEmu', {
            needs_backup: false,
        });
        cy.prefixedVisit('/accounts');

        acceptAnalyticsConsentOnInitializedDevice();

        cy.getTestElement('@suite-layout/body').should('be.visible');
        cy.getTestElement('@wallet/menu/wallet-send');
    });

    it('shows analytics consent and then goes to /accounts on initialized T2B1 device', () => {
        cy.task('startEmuFromUrl', startEmuOpts);
        cy.task('setupEmu', {
            needs_backup: false,
        });
        cy.prefixedVisit('/accounts');

        acceptAnalyticsConsentOnInitializedDevice();

        cy.getTestElement('@suite-layout/body').should('be.visible');
        cy.getTestElement('@wallet/menu/wallet-send');
    });
});

export {};
