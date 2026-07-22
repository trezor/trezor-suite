import { expect, test } from '../../support/fixtures';

test.describe('Promo banners', { tag: ['@T3T1'] }, () => {
    test.beforeEach(async ({ onboardingPage, settingsPage, dashboardPage }) => {
        await onboardingPage.completeOnboarding();
        await settingsPage.changeNetworks({ enableNetworks: ['btc'] });
        await settingsPage.toggleDebugModeInSettings();
        await settingsPage.navigateTo('debug');
        await settingsPage.debugTab.messageSystemLocalButton.click();
        await dashboardPage.navigateTo();
    });

    test('User can see and switch between promo banners', async ({
        promoBanner,
        page,
        yieldSection,
        dashboardPage,
    }) => {
        await test.step('Stablecoin yield banner is shown first', async () => {
            await expect(promoBanner.carouselSlide('stablecoin-yield')).toBeVisible();
            await expect(promoBanner.carouselIndicator(0)).toBeVisible();
        });

        await test.step('Switch to TS7 banner via carousel indicator', async () => {
            await promoBanner.carouselIndicator(1).click();
            await expect(promoBanner.promoCTAButton('ts7')).toBeVisible();
        });

        await test.step('TS7 CTA opens trezor.io in a new tab', async () => {
            const ts7PagePromise = page.context().waitForEvent('page');
            await promoBanner.promoCTAButton('ts7').click();
            const ts7Tab = await ts7PagePromise;
            await expect(ts7Tab).toHaveURL(/^https:\/\/trezor\.io\/trezor-safe-7/);
            await ts7Tab.close();
        });

        await test.step('Close TS7 banner and return to stablecoin yield', async () => {
            await promoBanner.closeButton.click();
            await expect(promoBanner.carouselSlide('ts7')).toBeHidden();
            await expect(promoBanner.carouselIndicator(1)).toBeHidden();
            await expect(promoBanner.carouselSlide('stablecoin-yield')).toBeVisible();
        });

        await test.step('Stablecoin yield CTA navigates to Yield section', async () => {
            await promoBanner.promoCTAButton('stablecoin-yield').click();
            await expect(yieldSection.yieldTitle).toBeVisible();
        });

        await test.step('Close last promo banner on dashboard', async () => {
            await dashboardPage.navigateTo();
            await expect(promoBanner.carouselSlide('stablecoin-yield')).toBeVisible();
            await promoBanner.closeButton.click();
            await expect(promoBanner.carouselSlide('stablecoin-yield')).toBeHidden();
        });
    });
});
