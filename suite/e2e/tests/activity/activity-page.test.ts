import { TestCategory, TestPriority, TestStream, createTestAnnotation } from '@trezor/e2e-utils';

import { expect, test } from '../../support/fixtures';

test.describe('Activity page', { tag: ['@T3W1'] }, () => {
    test.beforeEach(async ({ onboardingPage, settingsPage, activityPage }) => {
        await onboardingPage.completeOnboarding();
        await settingsPage.navigateTo('application');
        await settingsPage.toggleDebugModeInSettings();
        await activityPage.navigateTo();
    });

    test(
        'Transaction notifications land in the Notifications tab and mark it unseen',
        {
            annotation: createTestAnnotation({
                testCase:
                    'Verify that an unseen transaction activity is listed in the Notifications tab and that the tab title shows the unseen indicator.',
                category: TestCategory.Notifications,
                priority: TestPriority.High,
                stream: TestStream.Growth,
            }),
        },
        async ({ activityPage, toastSection }) => {
            await test.step('Add an unseen received transaction activity', async () => {
                await activityPage.triggerActivity('tx-received', { unseen: true });
            });

            await test.step('Transaction is listed as unseen in the Notifications tab', async () => {
                await activityPage.selectTab('transactions');

                await expect(activityPage.unseenItem('tx-received')).toBeVisible();
                await expect(activityPage.unseenIndicator).toBeVisible();
            });

            // The entry above is rendered, so a toast of the same dispatch would be too.
            await test.step('Received transaction does not pop a toast', async () => {
                await expect(toastSection.toast('tx-received')).toBeHidden();
            });
        },
    );

    test(
        'Non-transaction activity lands in the All activity tab',
        {
            annotation: createTestAnnotation({
                testCase:
                    'Verify that non-transaction activity is listed in the All activity tab only and never leaks into the transaction-only Notifications tab.',
                category: TestCategory.Notifications,
                priority: TestPriority.High,
                stream: TestStream.Growth,
            }),
        },
        async ({ activityPage, toastSection }) => {
            await test.step('Add a system activity and catch its toast', async () => {
                await activityPage.triggerActivity('settings-applied', { unseen: true });

                await expect(toastSection.toast('settings-applied')).toBeVisible();
                // Toasts stack over the injector's Add button, so dismiss before the next click.
                await toastSection.dismiss('settings-applied');
            });

            await test.step('Add a second system activity and catch its toast', async () => {
                await activityPage.triggerActivity('device-wiped', { unseen: true });

                await expect(toastSection.toast('device-wiped')).toBeVisible();
                await toastSection.dismiss('device-wiped');
            });

            await test.step('Both activities are listed in the All activity tab', async () => {
                await activityPage.selectTab('all');

                await expect(activityPage.listItem('settings-applied')).toBeVisible();
                await expect(activityPage.listItem('device-wiped')).toBeVisible();
            });

            await test.step('Neither activity leaks into the Notifications tab', async () => {
                await activityPage.selectTab('transactions');

                await expect(activityPage.listItem('settings-applied')).toBeHidden();
                await expect(activityPage.listItem('device-wiped')).toBeHidden();
            });
        },
    );

    test(
        'Unseen indicator clears after leaving the Activity page and stays cleared',
        {
            annotation: createTestAnnotation({
                testCase:
                    'Verify that transaction activity is marked as seen when the user leaves the Activity page, that the unseen indicator disappears and that it does not come back on a repeated visit.',
                category: TestCategory.Notifications,
                priority: TestPriority.High,
                stream: TestStream.Growth,
            }),
        },
        async ({ activityPage, dashboardPage }) => {
            await test.step('Add an unseen received transaction activity', async () => {
                await activityPage.triggerActivity('tx-received', { unseen: true });
                await activityPage.selectTab('transactions');

                await expect(activityPage.unseenIndicator).toBeVisible();
            });

            await test.step('Leaving the Activity page marks the transaction as seen', async () => {
                await dashboardPage.navigateTo();
                await activityPage.navigateTo();

                await expect(activityPage.unseenIndicator).toBeHidden();
                await expect(activityPage.seenItem('tx-received')).toBeVisible();
            });

            await test.step('Indicator stays cleared on a repeated visit', async () => {
                await dashboardPage.navigateTo();
                await activityPage.navigateTo();

                await expect(activityPage.unseenIndicator).toBeHidden();
                await expect(activityPage.seenItem('tx-received')).toBeVisible();
            });
        },
    );
});
