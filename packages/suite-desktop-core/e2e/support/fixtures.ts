/* eslint-disable react-hooks/rules-of-hooks */
import { AnalyticsFixture } from './analytics';
import { IndexedDbFixture } from './indexedDb';
import { BlockbookMock } from './mocks/blockBookMock';
import { MetadataProviderMock } from './mocks/metadataProviderMock';
import { TradingMock } from './mocks/tradingMock';
import { AnalyticsActions } from './pageActions/analyticsActions';
import { AssetsActions } from './pageActions/assetsActions';
import { DashboardActions } from './pageActions/dashboardActions';
import { DevicePromptActions } from './pageActions/devicePromptActions';
import { MarketActions } from './pageActions/marketActions';
import { MetadataActions } from './pageActions/metadata/metadataActions';
import { OnboardingActions } from './pageActions/onboarding/onboardingActions';
import { RecoveryActions } from './pageActions/recoveryActions';
import { SettingsActions } from './pageActions/settings/settingsActions';
import { SuiteGuide } from './pageActions/suiteGuideActions';
import { TrezorInputActions } from './pageActions/trezorInputActions';
import { WalletActions } from './pageActions/walletActions';
import { suiteBaseTest } from './testExtends/suiteBaseFixture';

type Fixtures = {
    dashboardPage: DashboardActions;
    settingsPage: SettingsActions;
    suiteGuidePage: SuiteGuide;
    walletPage: WalletActions;
    onboardingPage: OnboardingActions;
    analyticsPage: AnalyticsActions;
    devicePrompt: DevicePromptActions;
    recoveryPage: RecoveryActions;
    marketPage: MarketActions;
    assetsPage: AssetsActions;
    metadataPage: MetadataActions;
    trezorInput: TrezorInputActions;
    analytics: AnalyticsFixture;
    indexedDb: IndexedDbFixture;
    metadataProviderMock: MetadataProviderMock;
    blockbookMock: BlockbookMock;
    tradingMock: TradingMock;
};

const test = suiteBaseTest.extend<Fixtures>({
    dashboardPage: async ({ page, devicePrompt }, use) => {
        await use(new DashboardActions(page, devicePrompt));
    },
    settingsPage: async ({ page, url }, use) => {
        await use(new SettingsActions(page, url));
    },
    suiteGuidePage: async ({ page }, use) => {
        await use(new SuiteGuide(page));
    },
    walletPage: async ({ page }, use) => {
        await use(new WalletActions(page));
    },
    onboardingPage: async (
        { page, emulatorStartConf, devicePrompt, analyticsPage },
        use,
        testInfo,
    ) => {
        await use(
            new OnboardingActions(
                page,
                emulatorStartConf.model,
                testInfo,
                devicePrompt,
                analyticsPage,
            ),
        );
    },
    analyticsPage: async ({ page }, use) => {
        await use(new AnalyticsActions(page));
    },
    devicePrompt: async ({ page }, use) => {
        await use(new DevicePromptActions(page));
    },
    recoveryPage: async ({ page }, use) => {
        await use(new RecoveryActions(page));
    },
    marketPage: async ({ page, devicePrompt }, use) => {
        await use(new MarketActions(page, devicePrompt));
    },
    assetsPage: async ({ page }, use) => {
        await use(new AssetsActions(page));
    },
    metadataPage: async ({ page, devicePrompt }, use) => {
        await use(new MetadataActions(page, devicePrompt));
    },
    trezorInput: async ({ page }, use) => {
        await use(new TrezorInputActions(page));
    },
    analytics: async ({ page }, use) => {
        await use(new AnalyticsFixture(page));
    },
    indexedDb: async ({ page }, use) => {
        await use(new IndexedDbFixture(page));
    },
    metadataProviderMock: async ({ page }, use) => {
        const metadataProviderMock = new MetadataProviderMock(page);
        await use(metadataProviderMock);
        await metadataProviderMock.stop();
    },
    /* eslint-disable-next-line no-empty-pattern */
    blockbookMock: async ({}, use) => {
        const blockbookMock = new BlockbookMock();
        await use(blockbookMock);
        blockbookMock.stop();
    },
    tradingMock: async ({ page }, use) => {
        await use(new TradingMock(page));
    },
});

export { test };
export { expect } from './testExtends/customMatchers';
