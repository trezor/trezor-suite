import { CurrentsFixtures, CurrentsWorkerFixtures, fixtures } from '@currents/playwright';
import { test as baseTest } from '@playwright/test';

const currentsTest = baseTest.extend<CurrentsFixtures, CurrentsWorkerFixtures>({
    ...fixtures.baseFixtures,
    ...fixtures.coverageFixtures,
    ...fixtures.actionFixtures,
});

export { currentsTest };
