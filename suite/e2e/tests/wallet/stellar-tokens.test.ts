import { type Page } from '@playwright/test';

import { asNetworkSymbol } from '@suite-common/wallet-config';
import { TestCategory, TestPriority, TestStream } from '@trezor/e2e-utils';
import { BigNumber } from '@trezor/utils';

import { expect, test } from '../../support/fixtures';
import { type DevicePrompt } from '../../support/pageObjects/devicePrompt';
import { type StellarTokensSection } from '../../support/pageObjects/stellarTokensSection';
import { createTestAnnotation } from '../../support/reporters/annotations';

const xlm = asNetworkSymbol('xlm');
const USDC_ASSET_CODE = 'USDC';
const USDC_CONTRACT = 'USDC-GA5ZSEJYB37JRC5AVCIA5MOP4RHTM335X2KGX3IHOJAPP5RE34K4KZVN';
const ISSUER_PREFIX = 'GA5ZSEJY';
const ACCOUNT_REFRESH_TIMEOUT = 60_000;

type StellarAccount = {
    symbol: string;
    accountType: string;
    index: number;
    deviceState?: string;
    availableBalance: string;
    misc?: { reserve?: string; baseReserve?: string };
    tokens?: { contract: string; balance?: string }[];
};

type StellarAccountSnapshot = {
    reserve: string;
    baseReserve: string;
    availableBalance: string;
    usdcBalance?: string;
};

const readStellarAccount = async (page: Page): Promise<StellarAccountSnapshot> => {
    // Every discovered wallet stays in the store. The funded account is the selected one.
    const selectedDevice = await page.getReduxObject('device.selectedDevice');
    const deviceState = selectedDevice?.state?.staticSessionId as string | undefined;
    const accounts: StellarAccount[] = await page.getReduxObject('wallet.accounts');
    const account = accounts.find(
        item =>
            item.deviceState === deviceState &&
            item.symbol === xlm &&
            item.accountType === 'normal' &&
            item.index === 0,
    );

    if (!account?.misc?.reserve || !account.misc.baseReserve) {
        throw new Error('Funded Stellar account was not discovered on the passphrase wallet.');
    }

    const usdc = account.tokens?.find(token => token.contract === USDC_CONTRACT);

    return {
        reserve: account.misc.reserve,
        baseReserve: account.misc.baseReserve,
        availableBalance: account.availableBalance,
        usdcBalance: usdc?.balance,
    };
};

const deactivateOpenTrustline = async (
    stellarTokensSection: StellarTokensSection,
    devicePrompt: DevicePrompt,
) => {
    await stellarTokensSection.openTokensTab();
    await stellarTokensSection.showTokenRow(USDC_ASSET_CODE);
    await stellarTokensSection.openDeactivate(USDC_ASSET_CODE);
    await stellarTokensSection.expectDeactivationReturnsReserve();
    await stellarTokensSection.continueTrustline();
    await devicePrompt.confirmTrustline('Delete trust', USDC_ASSET_CODE, ISSUER_PREFIX);
    await expect(stellarTokensSection.deactivatedToast).toContainTranslation(
        'TR_DEACTIVATE_TOKEN_TOAST_SUCCESS',
        { timeout: ACCOUNT_REFRESH_TIMEOUT },
    );
    await expect(stellarTokensSection.tokenRow(USDC_ASSET_CODE)).toBeHidden({
        timeout: ACCOUNT_REFRESH_TIMEOUT,
    });
};

// Two ChangeTrust transactions share one mainnet account, so overlapping runs collide on its sequence.
test.describe('Stellar tokens', { tag: ['@webOnly', '@skipOnPR', '@T3T1'] }, () => {
    test.setTimeout(5 * 60 * 1000);
    test.use({
        deviceSetup: { mnemonic: 'mnemonic_academic', passphrase_protection: true },
    });

    test.beforeEach(async ({ onboardingPage, settingsPage, dashboardPage, walletPage }) => {
        await onboardingPage.completeOnboarding();
        await settingsPage.changeNetworks({ enableNetworks: [xlm] });
        await dashboardPage.deviceSwitchingOpenButton.click();
        await dashboardPage.addHiddenWallet(process.env.PASSPHRASE!);
        await walletPage.openAccount({ symbol: xlm });
    });

    test(
        'User can activate and deactivate a Stellar token',
        {
            annotation: createTestAnnotation({
                testCase:
                    'Verifies that a Stellar token trustline can be activated and deactivated.',
                category: TestCategory.Accounts,
                priority: TestPriority.High,
                stream: TestStream.Network,
            }),
        },
        async ({ page, stellarTokensSection, devicePrompt }) => {
            const existing = await readStellarAccount(page);

            expect(
                new BigNumber(existing.availableBalance).isGreaterThan(existing.baseReserve),
                'Stellar account needs spendable XLM above the trustline reserve',
            ).toBe(true);

            if (
                existing.usdcBalance !== undefined &&
                !new BigNumber(existing.usdcBalance).isZero()
            ) {
                throw new Error(
                    'USDC already has a balance, so deactivation is out of scope for this test',
                );
            }
            if (existing.usdcBalance !== undefined) {
                await deactivateOpenTrustline(stellarTokensSection, devicePrompt);
            }

            const beforeTrustline = await readStellarAccount(page);

            await test.step('Open inactive tokens and start USDC activation', async () => {
                await stellarTokensSection.openTokensTab();
                await stellarTokensSection.openInactiveTab();
                await stellarTokensSection.search(USDC_ASSET_CODE);
                await stellarTokensSection.startActivation(USDC_ASSET_CODE);
            });

            await test.step('Confirm the increased reserve', async () => {
                await stellarTokensSection.expectActivationDescribesReserve(USDC_ASSET_CODE);
            });

            await test.step('Confirm the trustline on the device', async () => {
                await stellarTokensSection.continueTrustline();
                await devicePrompt.confirmTrustline('Add trust', USDC_ASSET_CODE, ISSUER_PREFIX);
            });

            await test.step('Activated token is listed', async () => {
                await expect(stellarTokensSection.activatedToast).toContainTranslation(
                    'TR_ACTIVATE_TOKEN_TOAST_SUCCESS',
                    { timeout: ACCOUNT_REFRESH_TIMEOUT },
                );
                await stellarTokensSection.openTokensTab();
                await stellarTokensSection.showTokenRow(USDC_ASSET_CODE, {
                    timeout: ACCOUNT_REFRESH_TIMEOUT,
                });
            });

            await test.step('Deactivate the trustline on the device', async () => {
                await stellarTokensSection.openDeactivate(USDC_ASSET_CODE);
                await stellarTokensSection.expectDeactivationReturnsReserve();
                await stellarTokensSection.continueTrustline();
                await devicePrompt.confirmTrustline('Delete trust', USDC_ASSET_CODE, ISSUER_PREFIX);
                await expect(stellarTokensSection.deactivatedToast).toContainTranslation(
                    'TR_DEACTIVATE_TOKEN_TOAST_SUCCESS',
                    { timeout: ACCOUNT_REFRESH_TIMEOUT },
                );
            });

            await test.step('Token is gone and the reserve is released', async () => {
                await expect(stellarTokensSection.tokenRow(USDC_ASSET_CODE)).toBeHidden({
                    timeout: ACCOUNT_REFRESH_TIMEOUT,
                });

                await expect(async () => {
                    const afterTrustline = await readStellarAccount(page);
                    const spent = new BigNumber(beforeTrustline.availableBalance).minus(
                        afterTrustline.availableBalance,
                    );

                    expect(afterTrustline.reserve).toBe(beforeTrustline.reserve);
                    expect(spent.isGreaterThan(0)).toBe(true);
                    expect(spent.isLessThan(beforeTrustline.baseReserve)).toBe(true);
                }).toPass({ timeout: ACCOUNT_REFRESH_TIMEOUT });
            });
        },
    );
});
