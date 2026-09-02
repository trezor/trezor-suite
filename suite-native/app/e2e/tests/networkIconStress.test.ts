import { expect as detoxExpect } from 'detox';

import { openApp } from '../support/setup';
import { wait, waitForVisible } from '../support/utils';

const STRESS_DURATION_MS = 15 * 60 * 1000;
const TEST_TIMEOUT_MS = STRESS_DURATION_MS + 2 * 60 * 1000;

describe('NetworkIcon surface lifecycle stress [@noDevice]', () => {
    it(
        'repeatedly mounts and unmounts batches of NetworkIcon canvases',
        async () => {
            await openApp({});
            await waitForVisible(by.id('@screen/NetworkIconStress'));

            await device.disableSynchronization();
            await element(by.id('@networkIconStress/start')).tap();
            await waitForVisible(by.id('@networkIconStress/icons'));

            await wait(STRESS_DURATION_MS);

            await element(by.id('@networkIconStress/stop')).tap();
            await device.enableSynchronization();

            await detoxExpect(element(by.id('@screen/NetworkIconStress'))).toBeVisible();
        },
        TEST_TIMEOUT_MS,
    );
});
