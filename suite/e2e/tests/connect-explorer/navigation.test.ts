import { TestStream, createTestAnnotation } from '@trezor/e2e-utils';

import {
    expect,
    connectExplorerBaseTest as test,
} from '../../support/testExtends/connectExplorerBaseFixture';

const DEVICE_METHODS_FOLDER = '/methods/device';
// A method page that carries both an `h1` and the method testing tool, so one navigation covers
// the whole journey. The entry is still required to come from the rendered sidebar.
const DEVICE_METHOD_ENTRY = 'methods-device-getfeatures';

test.describe('Connect Explorer navigation', () => {
    test.beforeEach(async ({ page, connectExplorerUrl }) => {
        await page.goto(connectExplorerUrl, { waitUntil: 'load' });
    });

    test(
        'sidebar folder expands and its entry opens the method page',
        {
            annotation: createTestAnnotation({
                testCase: 'Connect Explorer: sidebar navigation to a method page',
                stream: TestStream.Connect,
            }),
        },
        async ({ page, sidebarSection, methodPage }) => {
            await sidebarSection.waitForTree();
            await sidebarSection.expandFolder(DEVICE_METHODS_FOLDER);

            const entries = await sidebarSection.getFolderItemEntries(DEVICE_METHODS_FOLDER);
            const entry = entries.find(item => item.testIdSegment === DEVICE_METHOD_ENTRY);
            expect(
                entry,
                `${DEVICE_METHOD_ENTRY} is listed under ${DEVICE_METHODS_FOLDER}`,
            ).toBeDefined();
            if (!entry) return;

            await sidebarSection.desktopLinkBySegment(entry.testIdSegment).click();

            const expectedPath = entry.href.replace(/\/$/, '');
            await expect(page).toHaveURL(url => url.pathname.replace(/\/$/, '') === expectedPath);
            await expect(methodPage.title).toBeVisible();
            await expect(methodPage.playgroundBox).toBeVisible();
        },
    );
});
