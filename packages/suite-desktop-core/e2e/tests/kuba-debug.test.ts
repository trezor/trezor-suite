import { test as testPlaywright, expect as expectPlaywright } from '@playwright/test';

import { launchSuite } from '../support/common';

// const timeout = 1000 * 60 * 5; // 5 minutes because it takes a while to start tor.

testPlaywright('Kuba test @debug', async () => {
    const suite = await launchSuite();
    await suite.window.waitForTimeout(10_000);
    throw new Error('Kuba test @debug');
    suite.electronApp.close();
});
