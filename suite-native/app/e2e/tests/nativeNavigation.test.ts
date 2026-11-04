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
});

// SwiftUI exposes its system tab labels, rather than custom tab button identifiers.
const getSystemTab = (label: string) => element(by.label(label).withAncestor(by.type('UITabBar')));

describe('Native navigation smoke [@noDevice @iosOnly]', () => {
    it('uses system tabs and returns to the existing bar when disabled', async () => {
        await openApp({ args: { preloadedState } });
        await device.takeScreenshot('native-navigation-ios-initial');
        await writeFile(
            'artifacts/native-navigation-ios-initial.xml',
            await device.generateViewHierarchyXml(),
        );

        const accountsTab = getSystemTab(EN_TRANSLATIONS['navigation.tabs.accountsList']);
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
