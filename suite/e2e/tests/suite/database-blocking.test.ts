import { TestStream } from '@trezor/e2e-utils';

import { expect, test } from '../../support/fixtures';
import { IndexedDbFixture } from '../../support/indexedDb';
import { createTestAnnotation } from '../../support/reporters/annotations';

test.use({ startEmulator: false });

test.describe('Database blocking', { tag: ['@webOnly', '@noDevice'] }, () => {
    test(
        'User can restart Suite once another tab releases the database',
        { annotation: createTestAnnotation({ stream: TestStream.Growth }) },
        async ({ page, url, databaseTab, analyticsSection, onboardingPage }) => {
            await onboardingPage.verifySuiteIsLoaded();
            await expect(analyticsSection.continueButton).toBeVisible();
            // Unload Suite so the only connection left is the deliberately held old database.
            await page.goto('about:blank');
            const otherDatabase = new IndexedDbFixture(databaseTab);
            await otherDatabase.reset();
            const connection = await otherDatabase.holdOldDatabaseConnection();

            await page.goto(url);
            await expect(onboardingPage.databaseUpgradeModalHeading).toHaveTranslation(
                'TR_DATABASE_UPGRADE_BLOCKED',
                {
                    timeout: 30_000,
                },
            );

            await connection.evaluate(db => db.close());
            await connection.dispose();
            await page.reload();
            await onboardingPage.verifySuiteIsLoaded();
            await expect(analyticsSection.continueButton).toBeVisible();
            await expect(onboardingPage.databaseUpgradeModalHeading).toBeHidden();
        },
    );

    test(
        'User sees the blocking warning and keeps saved settings after restarting Suite',
        { annotation: createTestAnnotation({ stream: TestStream.Growth }) },
        async ({
            page,
            databaseTab,
            analyticsSection,
            indexedDb,
            onboardingPage,
            dashboardPage,
        }) => {
            await onboardingPage.verifySuiteIsLoaded();
            await analyticsSection.continueButton.click();
            await page.expectReduxObjectToEqual('suite.lifecycle.status', 'ready', {
                timeout: 30_000,
            });
            await indexedDb.expectValue({
                dbName: 'trezor-suite',
                storeName: 'analytics',
                key: 'suite',
                valuePath: 'confirmed',
                expectedValue: true,
            });

            const otherDatabase = new IndexedDbFixture(databaseTab);
            await otherDatabase.requestAbortedUpgrade();
            await expect(onboardingPage.databaseUpgradeModalHeading).toHaveTranslation(
                'TR_THIS_INSTANCE_IS_BLOCKING',
            );

            await page.reload();
            await expect(dashboardPage.dashboardHeader).toBeVisible({ timeout: 30_000 });
            await page.expectReduxObjectToEqual('analytics.confirmed', true);
            await expect(analyticsSection.continueButton).toBeHidden();
            await expect(onboardingPage.databaseUpgradeModalHeading).toBeHidden();
        },
    );
});
