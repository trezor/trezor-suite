/* eslint-disable react-hooks/rules-of-hooks */
import { checkEvoluRelayServerRunning } from '@suite-common/e2e-evolu-client';

import { AnalyticsFixture, AnalyticsHelper } from './analytics';
import { EvoluClient } from './helpers/evoluClient';
import { IndexedDbFixture } from './indexedDb';
import { BlockbookMock } from './mocks/blockBookMock';
import { MetadataMock } from './mocks/metadataMock';
import { SolanaStakingMock } from './mocks/solanaStakingMock';
import { TradingMock } from './mocks/tradingMock';
import { AnalyticsSection } from './pageObjects/analyticsSection';
import { AssetsSection } from './pageObjects/assetsSection';
import { ConnectPermissionsModal } from './pageObjects/connectPermissionsModal';
import { DashboardPage } from './pageObjects/dashboardPage';
import { DevicePrompt } from './pageObjects/devicePrompt';
import { GuidePanel } from './pageObjects/guidePanel';
import { MetadataPage } from './pageObjects/metadata/metadataPage';
import { OnboardingPage } from './pageObjects/onboarding/onboardingPage';
import { PaginationControl } from './pageObjects/pagination';
import { RecoveryModal } from './pageObjects/recoveryModal';
import { SettingsPage } from './pageObjects/settings/settingsPage';
import { StakingSection } from './pageObjects/staking/stakingSection';
import { FeeSection } from './pageObjects/trading/feeSection';
import { TradingPage } from './pageObjects/trading/tradingPage';
import { TrezorInput } from './pageObjects/trezorInput';
import { WalletPage } from './pageObjects/walletPage';
import { suiteBaseTest } from './testExtends/suiteBaseFixture';
import { TradingStoreFixture } from './tradingStore';

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
    feeSection: FeeSection;
    assetsSection: AssetsSection;
    metadataPage: MetadataPage;
    trezorInput: TrezorInput;
    analytics: AnalyticsFixture;
    analyticsHelper: AnalyticsHelper;
    indexedDb: IndexedDbFixture;
    tradingStore: TradingStoreFixture;
    metadataMock: MetadataMock;
    blockbookMock: BlockbookMock;
    solanaStakingMock: SolanaStakingMock;
    tradingMock: TradingMock;
    connectPermissionsModal: ConnectPermissionsModal;
    stakingSection: StakingSection;
    paginationControl: PaginationControl;
    evoluClient: EvoluClient;
};

const test = suiteBaseTest.extend<Fixtures>({
    dashboardPage: async ({ page, device, devicePrompt }, use) => {
        await use(new DashboardPage(page, device, devicePrompt));
    },
    settingsPage: async ({ page, device }, use) => {
        await use(new SettingsPage(page, device));
    },
    guidePanel: async ({ page }, use) => {
        await use(new GuidePanel(page));
    },
    walletPage: async ({ page }, use) => {
        await use(new WalletPage(page));
    },
    onboardingPage: async ({ page, device, devicePrompt, analyticsSection, settingsPage }, use) => {
        await use(new OnboardingPage(page, device, devicePrompt, analyticsSection, settingsPage));
    },
    analyticsSection: async ({ page }, use) => {
        await use(new AnalyticsSection(page));
    },
    devicePrompt: async ({ page, device }, use) => {
        await use(new DevicePrompt(page, device));
    },
    recoveryModal: async ({ page }, use) => {
        await use(new RecoveryModal(page));
    },
    tradingPage: async ({ page, devicePrompt }, use) => {
        await use(new TradingPage(page, devicePrompt));
    },
    feeSection: async ({ page }, use) => {
        await use(new FeeSection(page));
    },
    assetsSection: async ({ page }, use) => {
        await use(new AssetsSection(page));
    },
    metadataPage: async ({ page, device, settingsPage, devicePrompt }, use) => {
        await use(new MetadataPage(page, device, settingsPage, devicePrompt));
    },
    trezorInput: async ({ page, device }, use) => {
        await use(new TrezorInput(page, device));
    },
    analytics: async ({ page }, use) => {
        await use(new AnalyticsFixture(page));
    },
    analyticsHelper: async ({ page }, use) => {
        await use(new AnalyticsHelper(page));
    },
    indexedDb: async ({ page }, use) => {
        await use(new IndexedDbFixture(page));
    },
    tradingStore: async ({ page }, use) => {
        await use(new TradingStoreFixture(page));
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
    paginationControl: async ({ page }, use) => {
        await use(new PaginationControl(page));
    },
    evoluClient: async ({}, use) => {
        await checkEvoluRelayServerRunning();
        const evoluClient = new EvoluClient();
        await use(evoluClient);
        await evoluClient.dispose();
    },
});

export { test };
export { expect } from './testExtends/customMatchers';
