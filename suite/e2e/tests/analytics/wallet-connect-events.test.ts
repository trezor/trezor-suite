import { EventType } from '@suite-common/analytics/src/constants';
import { TestCategory, TestPriority, TestStream, createTestAnnotation } from '@trezor/e2e-utils';

import { expect, test } from '../../support/walletConnectFixtures';

test.describe('Analytics Events - WalletConnect', { tag: ['@T3W1', '@nightlyOnly'] }, () => {
    let wcUri: string;

    const BASE_WC_EVENTS = [EventType.WalletConnectPaired, EventType.WalletConnectProposal];

    test.beforeEach(async ({ wcSignClient, onboardingPage, settingsPage }) => {
        await test.step('Generate WalletConnect URI', async () => {
            const result = await wcSignClient.connect();

            wcUri = result.uri;
        });
        await test.step('Onboarding', async () => {
            await onboardingPage.completeOnboarding();
            await settingsPage.changeNetworks({
                enableNetworks: ['ada'],
            });
        });
    });

    // --- WalletConnect Init Event ---
    test(
        `Should log ${EventType.WalletConnectInit} when loading Suite`,
        {
            annotation: createTestAnnotation({
                testCase: `Verify that the ${EventType.WalletConnectInit} event is triggered automatically when the application starts`,
                category: TestCategory.General,
                priority: TestPriority.Medium,
                stream: TestStream.Foundation,
            }),
        },
        async ({ analyticsHelper, page }) => {
            // Set up listeners
            const analyticsPromise = analyticsHelper.waitForEvent({
                c_type: EventType.WalletConnectInit,
            });

            // Perform the action
            await page.reload();

            // Await the listeners
            const payload = await analyticsPromise;

            expect(payload).toMatchObject({ c_type: EventType.WalletConnectInit });
        },
    );

    // --- WalletConnect Proposal Approved Events ---
    test(
        `Should log ${EventType.WalletConnectProposalApproved} when approving connection`,
        {
            annotation: createTestAnnotation({
                testCase: `Verify that ${EventType.WalletConnectProposalApproved} and related events are logged when the user confirms a WalletConnect proposal`,
                category: TestCategory.General,
                priority: TestPriority.Medium,
                stream: TestStream.Foundation,
            }),
        },
        async ({ settingsPage, analyticsHelper }) => {
            const EXPECTED_WC_EVENTS = [...BASE_WC_EVENTS, EventType.WalletConnectProposalApproved];

            // Set up listeners
            const analyticsPromise = analyticsHelper.collectEvents({
                count: EXPECTED_WC_EVENTS.length,
                c_types: EXPECTED_WC_EVENTS,
            });

            await test.step('Add connection', async () => {
                await settingsPage.navigateTo('connect');
                await settingsPage.walletConnectTab.addConnection(wcUri);
            });

            await test.step('Approve proposal & verify payloads', async () => {
                // Perform the action
                await settingsPage.walletConnectTab.approveProposal(0);
                // Await the listeners
                const payloads = await analyticsPromise;

                expect(payloads.map(p => p.c_type).sort()).toEqual([...EXPECTED_WC_EVENTS].sort());
            });
        },
    );

    // --- WalletConnect Proposal Rejected Events ---
    test(
        `Should log ${EventType.WalletConnectProposalRejected} when cancelling connection`,
        {
            annotation: createTestAnnotation({
                testCase: `Verify that ${EventType.WalletConnectProposalRejected} is logged when the user cancel a WalletConnect proposal`,
                category: TestCategory.General,
                priority: TestPriority.Medium,
                stream: TestStream.Foundation,
            }),
        },
        async ({ settingsPage, analyticsHelper }) => {
            const EXPECTED_WC_EVENTS = [...BASE_WC_EVENTS, EventType.WalletConnectProposalRejected];

            // Set up listeners
            const analyticsPromise = analyticsHelper.collectEvents({
                count: EXPECTED_WC_EVENTS.length,
                c_types: EXPECTED_WC_EVENTS,
            });

            await test.step('Add connection', async () => {
                await settingsPage.navigateTo('connect');
                await settingsPage.walletConnectTab.addConnection(wcUri);
            });

            await test.step('Reject proposal & verify payloads', async () => {
                // Perform the action
                await settingsPage.walletConnectTab.rejectProposal();
                // Await the listeners
                const payloads = await analyticsPromise;

                expect(payloads.map(p => p.c_type).sort()).toEqual([...EXPECTED_WC_EVENTS].sort());
            });
        },
    );
});
