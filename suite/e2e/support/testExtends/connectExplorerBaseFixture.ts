/* eslint-disable react-hooks/rules-of-hooks */

import { test as base } from '@playwright/test';

import { type Watcher, jsExceptionWatcher } from './watchers';
import { getConnectExplorerUrl } from '../helpers/connectExplorer';
import { MethodPage } from '../pageObjects/connectExplorer/methodPage';
import { NavbarPage } from '../pageObjects/connectExplorer/navbarPage';
import { SidebarPage } from '../pageObjects/connectExplorer/sidebarPage';

type ConnectExplorerBaseFixture = {
    connectExplorerUrl: string;
    ignoreJSExceptions: Array<string>;
    jsExceptionWatcher: Watcher | undefined;
    sidebarPage: SidebarPage;
    navbarPage: NavbarPage;
    methodPage: MethodPage;
};

/*
 * Every method page mounts the API playground, which initialises @trezor/connect for real: it
 * reaches for the Suite desktop websocket and then for the popup URL baked into the build. This
 * suite never asserts on Connect, so the exceptions that attempt throws are ignored. Keep the list
 * minimal and specific - anything broader would also swallow genuine explorer errors.
 */
const connectInitExceptions = [
    'Popup closed',
    'Popup blocked',
    'Handshake timeout',
    'Core timeout',
    'transport is not set',
];

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

    ignoreJSExceptions: connectInitExceptions,

    jsExceptionWatcher: [jsExceptionWatcher, { auto: true }],

    sidebarPage: async ({ page }, use) => {
        await use(new SidebarPage(page));
    },

    navbarPage: async ({ page }, use) => {
        await use(new NavbarPage(page));
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
/*
 * Plain Playwright `expect`: every matcher in `customMatchers.ts` is about a device display, a
 * Suite translation key or an account, none of which exist in this suite, and importing it would
 * pull the device fixture and trezor-user-env-link into a device-free suite.
 */
export { expect } from '@playwright/test';
