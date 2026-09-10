import { asNetworkSymbol } from '@suite-common/wallet-config';
import { TestStream } from '@trezor/e2e-utils';

import { isWebProject } from '../../support/common';
import { expect, test } from '../../support/fixtures';
import { createTestAnnotation } from '../../support/reporters/annotations';

test.describe('Promo banners', { tag: ['@T3T1'] }, () => {
    test.beforeEach(async ({ onboardingPage, settingsPage, dashboardPage }) => {
        await onboardingPage.completeOnboarding();
        await settingsPage.changeNetworks({ enableNetworks: [asNetworkSymbol('btc')] });
        await settingsPage.toggleDebugModeInSettings();
        await settingsPage.navigateTo('debug');
        await settingsPage.debugTab.addBanner('ts7');
        await settingsPage.debugTab.addBanner('defi-yield');
        await dashboardPage.navigateTo();
    });

    test(
        'User can see and switch between promo banners',
        { annotation: createTestAnnotation({ stream: TestStream.Wallet }) },
        async ({ promoBanner, page, yieldSection, dashboardPage, target }) => {
            await test.step('Stablecoin yield banner is shown first', async () => {
                await expect(promoBanner.carouselSlide('defi-yield')).toBeVisible();
                await expect(promoBanner.carouselIndicator(0)).toBeVisible();
            });

            await test.step('Switch to TS7 banner via carousel indicator', async () => {
                await promoBanner.carouselIndicator(1).click();
                await expect(promoBanner.promoCTAButton('ts7')).toBeVisible();
            });

            await test.step('TS7 CTA opens trezor.io in a new tab', async () => {
                await expect(promoBanner.promoCTAButton('ts7')).toHaveAttribute(
                    'href',
                    /^https:\/\/trezor\.io\/trezor-safe-7/,
                );
                await expect(promoBanner.promoCTAButton('ts7')).toBeEnabled();
                if (isWebProject(target)) {
                    const ts7PagePromise = page.context().waitForEvent('page');
                    await promoBanner.promoCTAButton('ts7').click();
                    const ts7Tab = await ts7PagePromise;
                    // eslint-disable-next-line playwright/no-conditional-expect
                    await expect(ts7Tab).toHaveURL(/^https:\/\/trezor\.io\/trezor-safe-7/);
                    await ts7Tab.close();
                }
            });

            await test.step('Close TS7 banner and return to stablecoin yield', async () => {
                await promoBanner.closeButton('ts7').click();
                await expect(promoBanner.carouselSlide('ts7')).toBeHidden();
                await expect(promoBanner.carouselIndicator(1)).toBeHidden();
                await expect(promoBanner.carouselSlide('defi-yield')).toBeVisible();
            });

            await test.step('Stablecoin yield CTA navigates to Yield section', async () => {
                await promoBanner.promoCTAButton('defi-yield').click();
                await expect(yieldSection.yieldTitle).toBeVisible();
            });

            await test.step('Close last promo banner on dashboard', async () => {
                await dashboardPage.navigateTo();
                await expect(promoBanner.carouselSlide('defi-yield')).toBeVisible();
                await promoBanner.closeButton('defi-yield').click();
                await expect(promoBanner.carouselSlide('defi-yield')).toBeHidden();
            });
        },
    );
});
