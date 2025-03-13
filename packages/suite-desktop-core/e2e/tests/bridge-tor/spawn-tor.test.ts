import { Page } from '@playwright/test';

import { skipFixture } from '../../support/common';
import { launchSuite } from '../../support/electron';
import { expect, test } from '../../support/fixtures';
import { NetworkAnalyzer } from '../../support/networkAnalyzer';

test.use({ exceptionLogger: skipFixture });

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

test.describe.skip('Tor loading screen', { tag: ['@group=suite', '@desktopOnly'] }, () => {
    /* eslint-disable-next-line no-empty-pattern */
    test('Tor loading screen: happy path', async ({}, testInfo) => {
        const suiteArgs = {
            artefactFolder: testInfo.outputDir,
            viewport: testInfo.project.use.viewport!,
        };
        test.setTimeout(timeout);

        let suite = await launchSuite(suiteArgs);

        await turnOnTorInSettings(suite.window);

        suite.electronApp.close();

        suite = await launchSuite(suiteArgs);

        await suite.window.waitForSelector('[data-testid="@tor-loading-screen"]', {
            state: 'visible',
        });

        await suite.window.waitForSelector('[data-testid="@welcome-layout/body"]', { timeout });

        suite.electronApp.close();
    });

    /* eslint-disable-next-line no-empty-pattern */
    test('Tor loading screen: making sure that all the request go throw Tor', async ({}, testInfo) => {
        const suiteArgs = {
            artefactFolder: testInfo.outputDir,
            viewport: testInfo.project.use.viewport!,
        };

        const networkAnalyzer = new NetworkAnalyzer();

        let suite = await launchSuite(suiteArgs);

        await turnOnTorInSettings(suite.window);

        suite.electronApp.close();

        suite = await launchSuite(suiteArgs);
        // Start network analyzer after making sure tor is going to be running.
        networkAnalyzer.start();

        await suite.window.waitForSelector('[data-testid="@tor-loading-screen"]', {
            state: 'visible',
        });

        await suite.window.waitForSelector('[data-testid="@welcome-layout/body"]', { timeout });
        networkAnalyzer.stop();
        const requests = networkAnalyzer.getRequests();
        requests.forEach(request => {
            expect(request).toContain('localhost:');
        });

        suite.electronApp.close();
    });

    /* eslint-disable-next-line no-empty-pattern */
    test('Tor loading screen: disable tor while loading', async ({}, testInfo) => {
        const suiteArgs = {
            artefactFolder: testInfo.outputDir,
            viewport: testInfo.project.use.viewport!,
        };
        test.setTimeout(timeout);

        let suite = await launchSuite(suiteArgs);

        await turnOnTorInSettings(suite.window);

        suite.electronApp.close();

        suite = await launchSuite(suiteArgs);

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
