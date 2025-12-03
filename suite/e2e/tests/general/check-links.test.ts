import { Page } from '@playwright/test';

import { TestCategory, TestPriority, TestStream } from '@trezor/e2e-utils';
import routes from '@trezor/suite/src//constants/suite/routes';

import { expect, test } from '../../support/fixtures';
import { createTestAnnotation } from '../../support/reporters/annotations';

async function getAllLinksFromAllPages(page: Page, paths: Array<string>): Promise<Set<string>> {
    const allValidHrefs = new Set<string>();

    for (const path of paths) {
        await page.goto(path, { waitUntil: 'domcontentloaded' });

        // Ensure the page is loaded by asserting the element is attached to the DOM.
        // For unknown reasons, this is the only available method to wait for the page to load.
        await expect(
            page
                .locator('[data-testid^="@welcome"]')
                .or(page.locator('[data-testid^="@suite-layout"]'))
                .or(page.locator('[data-testid^="@onboarding"]'))
                .first(),
            `The page element for route "${path}" should be attached`,
        ).toBeAttached();

        const links = page.locator('a');
        const allLinks = await links.all();
        const allHrefs = await Promise.all(allLinks.map(link => link.getAttribute('href')));

        for (const link of allHrefs) {
            expect.soft(link, `${link} should be a valid href`).toBeTruthy();

            // Normalize the links.
            if (link) allValidHrefs.add(new URL(link, page.url()).href);
        }
    }

    return allValidHrefs;
}

test.describe('Check Links', { tag: ['@webOnly', '@nightlyOnly', '@specificModel'] }, () => {
    test.use({ emulatorStartConf: { model: 'T3T1', wipe: true } });

    test.beforeEach(async ({ onboardingPage }) => {
        await onboardingPage.completeOnboarding();
    });

    test(
        'No 404s allowed',
        {
            annotation: createTestAnnotation({
                testCase: 'Verify that each link is OK',
                category: TestCategory.NotCategorized,
                priority: TestPriority.Low,
                stream: TestStream.Foundation,
            }),
        },
        async ({ page }) => {
            // Test is slow due to opening the pages for all known routes.
            // The standard timeout must be extended to ensure test completion.
            test.slow();

            // Create an array of all routes except those containing 4 segments
            // to keep the list a bit shorter, and reduce execution time.
            const allPaths = routes
                .map(route => route.pattern)
                .filter(pattern => {
                    const segments = pattern.split('/').filter(segment => !!segment);

                    return segments.length < 4;
                });

            const allUrls = await getAllLinksFromAllPages(page, allPaths);

            await Promise.all(
                Array.from(allUrls).map(async url => {
                    await test.step(`Checking link: ${url}`, async () => {
                        const response = await page.request.get(url);

                        expect.soft(response.ok(), `${url} should be OK`).toBeTruthy();
                    });
                }),
            );
        },
    );
});
