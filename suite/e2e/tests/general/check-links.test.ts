import { Page, TestInfo } from '@playwright/test';

import { routes } from '@suite/router-config';
import { TestCategory, TestPriority, TestStream } from '@trezor/e2e-utils';

import { expect, test } from '../../support/fixtures';
import { createTestAnnotation } from '../../support/reporters/annotations';

const IGNORED_PATTERNS = [
    'github.com/trezor/trezor-suite/releases/tag',
    'apps.apple.com/app/id1631884497',
];

async function getAllLinksFromAllPages(
    page: Page,
    testInfo: TestInfo,
    paths: Array<string>,
    filter: (url: string) => boolean,
): Promise<string[]> {
    const matchingLinks: string[] = [];

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
                    const url = new URL(link, page.url()).href;

                    if (!IGNORED_PATTERNS.some(pattern => url.includes(pattern)) && filter(url)) {
                        matchingLinks.push(url);
                    }
                } else {
                    testInfo.annotations.push({
                        type: 'Not Link',
                        description: `${link} is not a valid href`,
                    });
                }
            }
        });
    }

    return Array.from(new Set(matchingLinks));
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

async function checkLinks(page: Page, urls: string[]) {
    const chunkSize = 20;

    // Implement batching to prevent network flooding and false failures or timeouts.
    for (let i = 0; i < urls.length; i += chunkSize) {
        const chunk = urls.slice(i, i + chunkSize);

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
}

const SECTIONS = {
    general: [
        '/',
        '/notifications',
        '/version',
        '/bridge',
        '/bridge-requested',
        '/bridge-deprecated',
        '/connect-popup',
        '/udev',
        '/switch-device',
        '/password-manager',
        '/coinmarket-redirect',
    ],
    onboarding: [
        '/start',
        '/onboarding',
        '/recovery',
        '/backup',
        '/firmware',
        '/firmware-type',
        '/firmware-custom',
        '/create-multi-share-backup',
    ],
    settings: [
        '/settings',
        '/settings/debug',
        '/settings/device',
        '/settings/coins',
        '/settings/connected-apps',
    ],
    wallet: [
        '/accounts',
        '/accounts/send',
        '/accounts/receive',
        '/accounts/staking',
        '/accounts/sign-verify',
        '/accounts/details',
        '/accounts/anonymize',
        '/accounts/tokens',
        '/accounts/tokens/hidden',
        '/accounts/tokens/inactive',
        '/accounts/tokens/defi',
        '/accounts/nfts',
        '/accounts/nfts/hidden',
    ],
    trading: [
        '/accounts/coinmarket/buy',
        '/accounts/coinmarket/exchange',
        '/accounts/coinmarket/sell',
        '/accounts/coinmarket/concierge',
        '/accounts/coinmarket/transactions',
    ],
    earn: [
        '/earn',
        '/earn/yield/deposit',
        '/earn/yield/withdraw',
        '/earn/yield/claim',
        '/earn/tron',
        '/earn/tron/stake',
        '/earn/tron/vote',
        '/earn/tron/unstake',
        '/earn/tron/withdraw',
    ],
} as const satisfies Record<string, string[]>;

const allPaths = routes
    .map(route => route.pattern)
    .filter(pattern => pattern.split('/').filter(Boolean).length < 4);

const coveredPaths = new Set<string>(Object.values(SECTIONS).flat());

test('All routes are covered by SECTIONS', { tag: ['@webOnly', '@noDevice'] }, () => {
    const uncovered = allPaths.filter(path => !coveredPaths.has(path));

    expect(uncovered, `Routes not assigned to any section: ${uncovered.join(', ')}`).toHaveLength(
        0,
    );
});

test.describe('Check Links', { tag: ['@webOnly', '@nightlyOnly', '@T3T1'] }, () => {
    test.use({
        ignoreJSExceptions: ['Aborted by signal', 'Failed to fetch'],
    });

    for (const [section, paths] of Object.entries(SECTIONS) as [
        keyof typeof SECTIONS,
        string[],
    ][]) {
        test(
            `${section} links return 200`,
            {
                annotation: createTestAnnotation({
                    testCase: `Verify that all links in the ${section} section are OK`,
                    category: TestCategory.NotCategorized,
                    priority: TestPriority.Low,
                    stream: TestStream.Foundation,
                }),
            },
            async ({ page, onboardingPage, settingsPage }, testInfo) => {
                test.slow();

                await onboardingPage.completeOnboarding();
                await settingsPage.changeNetworks({ enableNetworks: ['btc'] });
                const links = await getAllLinksFromAllPages(page, testInfo, paths, () => true);

                await checkLinks(page, links);
            },
        );
    }
});
