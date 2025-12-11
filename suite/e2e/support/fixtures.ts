/* eslint-disable react-hooks/rules-of-hooks */
import { AnalyticsFixture } from './analytics';
import { IndexedDbFixture } from './indexedDb';
import { BlockbookMock } from './mocks/blockBookMock';
import { MetadataMock } from './mocks/metadataMock';
import { SolanaStakingMock } from './mocks/solanaStakingMock';
import { TradingMock } from './mocks/tradingMock';
import { ModelFixture } from './modelFixture';
import { AnalyticsSection } from './pageObjects/analyticsSection';
import { AssetsSection } from './pageObjects/assetsSection';
import { ConnectPermissionsModal } from './pageObjects/connectPermissionsModal';
import { DashboardPage } from './pageObjects/dashboardPage';
import { DevicePrompt } from './pageObjects/devicePrompt';
import { GuidePanel } from './pageObjects/guidePanel';
import { MetadataPage } from './pageObjects/metadata/metadataPage';
import { OnboardingPage } from './pageObjects/onboarding/onboardingPage';
import { RecoveryModal } from './pageObjects/recoveryModal';
import { SettingsPage } from './pageObjects/settings/settingsPage';
import { StakingSection } from './pageObjects/staking/stakingSection';
import { TradingPage } from './pageObjects/trading/tradingPage';
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
    solanaStakingMock: SolanaStakingMock;
    tradingMock: TradingMock;
    connectPermissionsModal: ConnectPermissionsModal;
    stakingSection: StakingSection;
    model: ModelFixture;
};

const test = suiteBaseTest.extend<Fixtures>({
    dashboardPage: async ({ page, devicePrompt }, use) => {
        await use(new DashboardPage(page, devicePrompt));
    },
    settingsPage: async ({ page }, use) => {
        await use(new SettingsPage(page));
    },
    guidePanel: async ({ page }, use) => {
        await use(new GuidePanel(page));
    },
    walletPage: async ({ page }, use) => {
        await use(new WalletPage(page));
    },
    onboardingPage: async (
        { page, model, devicePrompt, analyticsSection, settingsPage, emulatorStartConf },
        use,
    ) => {
        await use(
            new OnboardingPage(
                page,
                model,
                devicePrompt,
                analyticsSection,
                settingsPage,
                emulatorStartConf,
            ),
        );
    },
    analyticsSection: async ({ page }, use) => {
        await use(new AnalyticsSection(page));
    },
    devicePrompt: async ({ page, model }, use) => {
        await use(new DevicePrompt(page, model));
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
    metadataPage: async ({ page, settingsPage, devicePrompt }, use) => {
        await use(new MetadataPage(page, settingsPage, devicePrompt));
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
    blockbookMock: async ({}, use) => {
        const blockbookMock = new BlockbookMock();
        await use(blockbookMock);
        blockbookMock.stop();
    },
    solanaStakingMock: async ({ page }, use) => {
        await use(new SolanaStakingMock(page));
    },
    tradingMock: async ({ page }, use) => {
        await use(new TradingMock(page));
    },
    connectPermissionsModal: async ({ page }, use) => {
        await use(new ConnectPermissionsModal(page));
    },
    stakingSection: async ({ page }, use) => {
        await use(new StakingSection(page));
    },
    model: async ({ emulatorStartConf }, use) => {
        await use(new ModelFixture(emulatorStartConf.model));
    },
});

export { test };
export { expect } from './testExtends/customMatchers';
