/* eslint-disable react-hooks/rules-of-hooks */
import { AnalyticsFixture } from './analytics';
import { IndexedDbFixture } from './indexedDb';
import { BlockbookMock } from './mocks/blockBookMock';
import { MetadataMock } from './mocks/metadataMock';
import { TradingMock } from './mocks/tradingMock';
import { AnalyticsSection } from './pageObjects/analyticsSection';
import { AssetsSection } from './pageObjects/assetsSection';
import { DashboardPage } from './pageObjects/dashboardPage';
import { DevicePrompt } from './pageObjects/devicePrompt';
import { GuidePanel } from './pageObjects/guidePanel';
import { MetadataPage } from './pageObjects/metadata/metadataPage';
import { OnboardingPage } from './pageObjects/onboarding/onboardingPage';
import { RecoveryModal } from './pageObjects/recoveryModal';
import { SettingsPage } from './pageObjects/settings/settingsPage';
import { TradingPage } from './pageObjects/tradingPage';
import { TrezorInput } from './pageObjects/trezorInput';
import { WalletPage } from './pageObjects/walletPage';
import { suiteBaseTest } from './testExtends/suiteBaseFixture';

type Fixtures = {
    dashboardPage: DashboardPage;
    settingsPage: SettingsPage;
    guidePanel: GuidePanel;
    walletPage: WalletPage;
    onboardingPage: OnboardingPage;
    analyticsSection: AnalyticsSection;
    devicePrompt: DevicePrompt;
    recoveryModal: RecoveryModal;
    tradingPage: TradingPage;
    assetsSection: AssetsSection;
    metadataPage: MetadataPage;
    trezorInput: TrezorInput;
    analytics: AnalyticsFixture;
    indexedDb: IndexedDbFixture;
    metadataMock: MetadataMock;
    blockbookMock: BlockbookMock;
    tradingMock: TradingMock;
};

const test = suiteBaseTest.extend<Fixtures>({
    dashboardPage: async ({ page, devicePrompt }, use) => {
        await use(new DashboardPage(page, devicePrompt));
    },
    settingsPage: async ({ page, url }, use) => {
        await use(new SettingsPage(page, url));
    },
    guidePanel: async ({ page }, use) => {
        await use(new GuidePanel(page));
    },
    walletPage: async ({ page }, use) => {
        await use(new WalletPage(page));
    },
    onboardingPage: async (
        { page, emulatorStartConf, devicePrompt, analyticsSection },
        use,
        testInfo,
    ) => {
        await use(
            new OnboardingPage(
                page,
                emulatorStartConf.model,
                testInfo,
                devicePrompt,
                analyticsSection,
            ),
        );
    },
    analyticsSection: async ({ page }, use) => {
        await use(new AnalyticsSection(page));
    },
    devicePrompt: async ({ page }, use) => {
        await use(new DevicePrompt(page));
    },
    recoveryModal: async ({ page }, use) => {
        await use(new RecoveryModal(page));
    },
    tradingPage: async ({ page, devicePrompt }, use) => {
        await use(new TradingPage(page, devicePrompt));
    },
    assetsSection: async ({ page }, use) => {
        await use(new AssetsSection(page));
    },
    metadataPage: async ({ page, devicePrompt }, use) => {
        await use(new MetadataPage(page, devicePrompt));
    },
    trezorInput: async ({ page }, use) => {
        await use(new TrezorInput(page));
    },
    analytics: async ({ page }, use) => {
        await use(new AnalyticsFixture(page));
    },
    indexedDb: async ({ page }, use) => {
        await use(new IndexedDbFixture(page));
    },
    metadataMock: async ({ page }, use) => {
        const metadataMock = new MetadataMock(page);
        await use(metadataMock);
        await metadataMock.stop();
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
