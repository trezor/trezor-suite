/* eslint-disable react-hooks/rules-of-hooks */

import { test as base } from '@playwright/test';

import { type Watcher, jsExceptionWatcher } from './watchers';
import { getConnectExplorerUrl } from '../helpers/connectExplorer';
import { MethodPage } from '../pageObjects/connectExplorer/methodPage';
import { NavbarSection } from '../pageObjects/connectExplorer/navbarSection';
import { SidebarSection } from '../pageObjects/connectExplorer/sidebarSection';

type ConnectExplorerBaseFixture = {
    connectExplorerUrl: string;
    ignoreJSExceptions: Array<string>;
    jsExceptionWatcher: Watcher | undefined;
    sidebarSection: SidebarSection;
    navbarSection: NavbarSection;
    methodPage: MethodPage;
};

/**
 * Base test for the Connect Explorer UI suite. It is deliberately built on plain `@playwright/test`
 * instead of `suiteBaseTest`, whose auto `device` fixture talks to trezor-user-env and whose web
 * setup starts the bridge: the explorer is a static documentation site, so this suite stays
 * device-free, bridge-free and secret-free.
 */
const connectExplorerBaseTest = base.extend<ConnectExplorerBaseFixture>({
    connectExplorerUrl: async ({}, use) => {
        await use(getConnectExplorerUrl());
    },

    ignoreJSExceptions: [],

    jsExceptionWatcher: [jsExceptionWatcher, { auto: true }],

    sidebarSection: async ({ page }, use) => {
        await use(new SidebarSection(page));
    },

    navbarSection: async ({ page }, use) => {
        await use(new NavbarSection(page));
    },

    methodPage: async ({ page }, use) => {
        await use(new MethodPage(page));
    },
});

// Stop the watcher right after the test, so teardown noise is not collected as a failure.
connectExplorerBaseTest.afterEach(async ({ jsExceptionWatcher: watcher }) => {
    await connectExplorerBaseTest.step('Stopping watchers', () => {
        watcher?.stop();
    });
});

export { connectExplorerBaseTest };
export { expect } from './customMatchers';
