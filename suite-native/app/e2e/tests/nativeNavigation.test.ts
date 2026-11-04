import { expect as detoxExpect } from 'detox';
import { writeFile } from 'node:fs/promises';

import EN_TRANSLATIONS from '@suite-native/intl/translations/en-US.json';

import { onboardingCompletedState } from '../fixtures/onboardingCompletedState';
import { onSettings } from '../pageObjects/settingsActions';
import { onTabBar } from '../pageObjects/tabBarActions';
import { openApp, preparePreloadedReduxState } from '../support/setup';
import { waitForVisible } from '../support/utils';

const preloadedState = preparePreloadedReduxState(onboardingCompletedState, {
    appSettings: { experimentalFeatures: ['native-navigation'] },
    locale: { appLocaleCode: 'en-US' },
});

// iOS 26 exposes two accessibility copies of each system tab at the same activation point.
const getSystemTab = (label: string) =>
    element(
        by
            .label(label)
            .and(by.traits(['button']))
            .withAncestor(by.type('UITabBar')),
    ).atIndex(0);

describe('Native navigation smoke [@noDevice @iosOnly]', () => {
    it('uses system tabs and returns to the existing bar when disabled', async () => {
        await openApp({ args: { preloadedState } });
        await device.takeScreenshot('native-navigation-ios-initial');
        await writeFile(
            'artifacts/native-navigation-ios-initial.xml',
            await device.generateViewHierarchyXml(),
        );

        const accountsTab = getSystemTab(EN_TRANSLATIONS['navigation.tabs.accountsList']);
        await writeFile(
            'artifacts/native-navigation-ios-accounts.json',
            JSON.stringify(await accountsTab.getAttributes(), null, 2),
        );
        await waitForVisible(accountsTab);
        await accountsTab.tap();
        await detoxExpect(element(by.id('@screen/Accounts'))).toBeVisible();

        await getSystemTab(EN_TRANSLATIONS['navigation.tabs.settings']).tap();
        await detoxExpect(element(by.id('@screen/Settings'))).toBeVisible();
        await device.takeScreenshot('native-navigation-ios');

        await onSettings.openSection('experimental');
        await element(by.id('settings/experimental-native-navigation-touchable-row')).tap();
        await onTabBar.tapBackButton();

        await detoxExpect(element(by.id('@tabBar/Settings'))).toBeVisible();
        await detoxExpect(element(by.id('@screen/Settings'))).toBeVisible();
        await device.takeScreenshot('native-navigation-ios-disabled');
    });
});
