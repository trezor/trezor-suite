import { Page } from '@playwright/test';

import { test, expect } from '../support/fixtures';
import { launchSuite } from '../support/common';
import { NetworkAnalyzer } from '../support/networkAnalyzer';

const timeout = 1000 * 60 * 5; // 5 minutes because it takes a while to start tor.

const turnOnTorInSettings = async (window: Page, shouldEnableTor = true) => {
    await window.click('[data-testid="@suite/menu/settings"]');
    await window.waitForSelector('[data-testid="@settings/general/tor-switch"]');
    const torIAlreadyEnabled = await window.isChecked(
        '[data-testid="@settings/general/tor-switch"] > input',
    );
    if ((shouldEnableTor && torIAlreadyEnabled) || (!shouldEnableTor && !torIAlreadyEnabled)) {
        // If tor is already enabled, we return early.
        return;
    }

    await window.click('[data-testid="@settings/general/tor-switch"]');
    await window.waitForSelector('[data-testid="@loading-content/loader"]', {
        state: 'visible',
    });
    await window.waitForSelector('[data-testid="@loading-content/loader"]', {
        state: 'detached',
        timeout,
    });
    await expect(
        window.locator('[data-testid="@settings/general/tor-switch"] > input'),
    ).toBeChecked();

    await window.waitForTimeout(1000);
};

test.describe.skip('Tor loading screen', () => {
    test('Tor loading screen: happy path', async () => {
        test.setTimeout(timeout);

        let suite = await launchSuite();

        await turnOnTorInSettings(suite.window);

        suite.electronApp.close();

        suite = await launchSuite();

        await suite.window.waitForSelector('[data-testid="@tor-loading-screen"]', {
            state: 'visible',
        });

        await suite.window.waitForSelector('[data-testid="@welcome/title"]', { timeout });

        suite.electronApp.close();
    });

    test('Tor loading screen: making sure that all the request go throw Tor', async () => {
        test.setTimeout(timeout);

        const networkAnalyzer = new NetworkAnalyzer();

        let suite = await launchSuite();

        await turnOnTorInSettings(suite.window);

        suite.electronApp.close();

        suite = await launchSuite();
        // Start network analyzer after making sure tor is going to be running.
        networkAnalyzer.start();

        await suite.window.waitForSelector('[data-testid="@tor-loading-screen"]', {
            state: 'visible',
        });

        await suite.window.waitForSelector('[data-testid="@welcome/title"]', { timeout });
        networkAnalyzer.stop();
        const requests = networkAnalyzer.getRequests();
        requests.forEach(request => {
            expect(request).toContain('localhost:');
        });

        suite.electronApp.close();
    });

    test('Tor loading screen: disable tor while loading', async () => {
        test.setTimeout(timeout);

        let suite = await launchSuite();

        await turnOnTorInSettings(suite.window);

        suite.electronApp.close();

        suite = await launchSuite();

        await suite.window.waitForSelector('[data-testid="@tor-loading-screen"]', {
            state: 'visible',
        });
        await suite.window.click('[data-testid="@tor-loading-screen/disable-button"]');

        // disabling loader appears and disappears
        suite.window.locator('text=Disabling Tor');
        await suite.window.click('[data-testid="@suite/menu/settings"]');

        await expect(
            suite.window.locator('[data-testid="@settings/general/tor-switch"] > input'),
        ).not.toBeChecked();

        suite.electronApp.close();
    });
});
