import { Page, TestInfo } from '@playwright/test';

import { routes } from '@suite/router';
import { TestCategory, TestPriority, TestStream } from '@trezor/e2e-utils';

import { expect, test } from '../../support/fixtures';
import { createTestAnnotation } from '../../support/reporters/annotations';

async function getAllLinksFromAllPages(
    page: Page,
    testInfo: TestInfo,
    paths: Array<string>,
): Promise<Set<string>> {
    const allValidHrefs = new Set<string>();

    for (const path of paths) {
        await test.step(`Get the links from ${path}`, async () => {
            await page.goto(`.${path}`, { waitUntil: 'domcontentloaded' });

            // Ensure the page is loaded by asserting the element is attached to the DOM.
            // For unknown reasons, this is the only available method to wait for the page to load.
            const pageContent = page
                .locator('[data-testid^="@welcome"]')
                .or(page.locator('[data-testid^="@suite-layout"]'))
                .or(page.locator('[data-testid^="@onboarding"]'))
                .first();

            try {
                await pageContent.waitFor({ state: 'attached', timeout: 10_000 });
            } catch {
                await test.step(`Page element not found for ${path}, reloading...`, async () => {
                    await page.reload({ waitUntil: 'domcontentloaded', timeout: 10_000 });
                });
            }

            await expect(
                pageContent,
                `The page element for route "${path}" should be attached`,
            ).toBeAttached();
            await expect(page.getByTestId('@suite/bundle-loader')).toBeHidden();

            // Extract all hrefs in a single browser operation to reduce network latency in CI.
            const allHrefs = await page
                .locator('a')
                .evaluateAll(anchors => anchors.map(a => a.getAttribute('href')));

            for (const link of allHrefs) {
                if (link) {
                    // Normalize the links.
                    allValidHrefs.add(new URL(link, page.url()).href);
                } else {
                    testInfo.annotations.push({
                        type: 'Not Link',
                        description: `${link} is not a valid href`,
                    });
                }
            }
        });
    }

    return allValidHrefs;
}

async function fetchWithRetry(page: Page, url: string, maxRetries = 3) {
    let response = await page.request.get(url);

    let attempts = 0;
    while (response.status() === 429 && attempts < maxRetries) {
        attempts++;
        const waitTime = 2000 * attempts;

        await test.step(`[429] Rate limit on ${url}. Retry ${attempts}/${maxRetries}`, async () => {
            await page.waitForTimeout(waitTime);
            response = await page.request.get(url);
        });
    }

    return response;
}

test.describe('Check Links', { tag: ['@webOnly', '@nightlyOnly', '@T3T1'] }, () => {
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
        async ({ page }, testInfo) => {
            let allUrls = new Set<string>();

            const urlsToCheck: string[] = [];
            // Test is slow due to opening the pages for all known routes.
            // The standard timeout must be extended to ensure test completion.
            test.slow();

            await test.step('Get all links from all routes', async () => {
                // Create an array of all routes except those containing 4 segments
                // to keep the list a bit shorter, and reduce execution time.
                const allPaths = routes
                    .map(route => route.pattern)
                    .filter(pattern => {
                        const segments = pattern.split('/').filter(segment => !!segment);

                        return segments.length < 4;
                    });

                // After onboarding, the URL is cleared to the base domain by the application's routing logic.
                // We need to navigate back to the correct base URL for the test environment.
                allUrls = await getAllLinksFromAllPages(page, testInfo, allPaths);
            });

            await test.step('Filter known broken links', () => {
                // Define patterns for known broken links here.
                const ignoredPatterns: string[] = ['github.com/trezor/trezor-suite/releases/tag'];
                const knownBrokenLinks: string[] = [];

                for (const url of allUrls) {
                    const ignoredUrl = ignoredPatterns.some(pattern => url.includes(pattern));

                    if (ignoredUrl) {
                        knownBrokenLinks.push(url);
                    } else {
                        urlsToCheck.push(url);
                    }
                }

                if (knownBrokenLinks.length > 0) {
                    testInfo.annotations.push({
                        type: 'Warning: Known Broken Links',
                        description: `\nThe following links returned non-200 status codes but are known issues:\n${knownBrokenLinks.join('\n')}`,
                    });
                }
            });

            await test.step(`Check ${urlsToCheck.length} valid links`, async () => {
                const chunkSize = 20;

                // Implement batching to prevent network flooding and false failures or timeouts.
                for (let i = 0; i < urlsToCheck.length; i += chunkSize) {
                    const chunk = urlsToCheck.slice(i, i + chunkSize);

                    await Promise.all(
                        chunk.map(async url => {
                            await test.step(`Checking link: ${url}`, async () => {
                                const response = await fetchWithRetry(page, url);

                                expect
                                    .soft(
                                        response.ok(),
                                        `${url} failed: HTTP Status ${response.status()} ${response.statusText()}`,
                                    )
                                    .toBeTruthy();
                            });
                        }),
                    );
                }
            });
        },
    );
});
