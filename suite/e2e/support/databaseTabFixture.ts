/* eslint-disable react-hooks/rules-of-hooks */
import type { BrowserContext, Page, TestFixture } from '@playwright/test';

type DatabaseTabFixtureDeps = {
    page: Page;
    context: BrowserContext;
};

export const databaseTabFixture: TestFixture<Page, DatabaseTabFixtureDeps> = async (
    { page, context },
    use,
) => {
    const databaseTab = await context.newPage();
    const url = new URL('__e2e_database__', page.url()).href;
    // The other tab shares IndexedDB, but must not start another Suite or reset its storage.
    await databaseTab.route(url, route =>
        route.fulfill({
            contentType: 'text/html',
            body: '<!doctype html><title>Database holder</title>',
        }),
    );
    await databaseTab.goto(url);
    await use(databaseTab);
    await databaseTab.close();
};
