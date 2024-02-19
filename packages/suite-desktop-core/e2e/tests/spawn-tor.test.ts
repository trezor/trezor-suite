import { Page, test as testPlaywright, expect as expectPlaywright } from '@playwright/test';

import { launchSuite } from '../support/common';
import { NetworkAnalyzer } from '../support/networkAnalyzer';

const timeout = 1000 * 60 * 5; // 5 minutes because it takes a while to start tor.

const turnOnTorInSettings = async (window: Page, shouldEnableTor = true) => {
    await window.click('[data-test-id="@suite/menu/settings"]');
    await window.waitForSelector('[data-test-id="@settings/general/tor-switch"]');
    const torIAlreadyEnabled = await window.isChecked(
        '[data-test-id="@settings/general/tor-switch"] > input',
    );
    if ((shouldEnableTor && torIAlreadyEnabled) || (!shouldEnableTor && !torIAlreadyEnabled)) {
        // If tor is already enabled, we return early.
        return;
    }

    await window.click('[data-test-id="@settings/general/tor-switch"]');
    await window.waitForSelector('[data-test-id="@loading-content/loader"]', {
        state: 'visible',
    });
    await window.waitForSelector('[data-test-id="@loading-content/loader"]', {
        state: 'detached',
        timeout,
    });
    await expectPlaywright(
        window.locator('[data-test-id="@settings/general/tor-switch"] > input'),
    ).toBeChecked();

    await window.waitForTimeout(1000);
};

testPlaywright.describe('Tor loading screen', () => {
    testPlaywright('Tor loading screen: happy path', async () => {
        testPlaywright.setTimeout(timeout);

        let suite = await launchSuite();

        await turnOnTorInSettings(suite.window);

        suite.electronApp.close();

        suite = await launchSuite();

        await suite.window.waitForSelector('[data-test-id="@tor-loading-screen"]', {
            state: 'visible',
        });

        await suite.window.waitForSelector('[data-test-id="@welcome/title"]', { timeout });

        suite.electronApp.close();
    });

    testPlaywright(
        'Tor loading screen: making sure that all the request go throw Tor',
        async () => {
            testPlaywright.setTimeout(timeout);

            const networkAnalyzer = new NetworkAnalyzer();

            let suite = await launchSuite();

            await turnOnTorInSettings(suite.window);

            suite.electronApp.close();

            suite = await launchSuite();
            // Start network analyzer after making sure tor is going to be running.
            networkAnalyzer.start();

            await suite.window.waitForSelector('[data-test-id="@tor-loading-screen"]', {
                state: 'visible',
            });

            await suite.window.waitForSelector('[data-test-id="@welcome/title"]', { timeout });
            networkAnalyzer.stop();
            const requests = networkAnalyzer.getRequests();
            requests.forEach(request => {
                expectPlaywright(request).toContain('localhost:');
            });

            suite.electronApp.close();
        },
    );

    testPlaywright('Tor loading screen: disable tor while loading', async () => {
        testPlaywright.setTimeout(timeout);

        let suite = await launchSuite();

        await turnOnTorInSettings(suite.window);

        suite.electronApp.close();

        suite = await launchSuite();

        await suite.window.waitForSelector('[data-test-id="@tor-loading-screen"]', {
            state: 'visible',
        });
        await suite.window.click('[data-test-id="@tor-loading-screen/disable-button"]');

        // disabling loader appears and disappears
        suite.window.locator('text=Disabling Tor');
        await suite.window.click('[data-test-id="@suite/menu/settings"]');

        await expectPlaywright(
            suite.window.locator('[data-test-id="@settings/general/tor-switch"] > input'),
        ).not.toBeChecked();

        suite.electronApp.close();
    });
});
