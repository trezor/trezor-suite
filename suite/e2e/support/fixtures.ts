/* eslint-disable react-hooks/rules-of-hooks */
import { checkEvoluRelayServerRunning } from '@suite-common/e2e-evolu-client';
import type { PerfMetrics } from '@trezor/perf-e2e';

import { AnalyticsFixture, AnalyticsHelper } from './analytics';
import { ClipboardFixture } from './clipboard';
import { isDesktopProject } from './common';
import { measurePerformance } from '../performance/perfMeasure';
import { EvoluClient } from './helpers/evoluClient';
import { IndexedDbFixture } from './indexedDb';
import { BlockbookMock } from './mocks/blockBookMock';
import { MetadataMock } from './mocks/metadataMock';
import { SolanaStakingMock } from './mocks/solanaStakingMock';
import { TradingMockNew } from './mocks/trading/tradingMockNew';
import { TradingResponses, observeTradingResponses } from './mocks/trading/tradingResponses';
import { TradingMock } from './mocks/tradingMock';
import { YieldMock } from './mocks/yieldMock';
import { ActivityPage } from './pageObjects/activityPage';
import { AnalyticsSection } from './pageObjects/analyticsSection';
import { AssetsSection } from './pageObjects/assetsSection';
import { ConnectPermissionsModal } from './pageObjects/connectPermissionsModal';
import { ConnectSelectAccountModal } from './pageObjects/connectSelectAccountModal';
import { DashboardPage } from './pageObjects/dashboardPage';
import { DevicePrompt } from './pageObjects/devicePrompt';
import { GuidePanel } from './pageObjects/guidePanel';
import { MetadataPage } from './pageObjects/metadata/metadataPage';
import { OnboardingPage } from './pageObjects/onboarding/onboardingPage';
import { PaginationControl } from './pageObjects/pagination';
import { RecoveryModal } from './pageObjects/recoveryModal';
import { SettingsPage } from './pageObjects/settings/settingsPage';
import { StakingSection } from './pageObjects/staking/stakingSection';
import { ToastSection } from './pageObjects/toastSection';
import { FeeSection } from './pageObjects/trading/feeSection';
import { TradingPage } from './pageObjects/trading/tradingPage';
import { TrezorInput } from './pageObjects/trezorInput';
import { TxSimulationModal } from './pageObjects/txSimulationModal';
import { WalletPage } from './pageObjects/walletPage';
import { YieldConsentModal } from './pageObjects/yield/yieldConsentModal';
import { YieldFlowSection } from './pageObjects/yield/yieldFlowSection';
import { YieldNutshellModal } from './pageObjects/yield/yieldNutshellModal';
import { YieldSection } from './pageObjects/yield/yieldSection';
import { suiteBaseTest } from './testExtends/suiteBaseFixture';
import { TradingStoreFixture } from './tradingStore';

type Fixtures = {
    activityPage: ActivityPage;
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
    tradingMockNew: TradingMockNew;
    tradingResponses: TradingResponses;
    connectPermissionsModal: ConnectPermissionsModal;
    connectSelectAccountModal: ConnectSelectAccountModal;
    stakingSection: StakingSection;
    yieldSection: YieldSection;
    yieldFlowSection: YieldFlowSection;
    yieldNutshellModal: YieldNutshellModal;
    yieldConsentModal: YieldConsentModal;
    yieldMock: YieldMock;
    txSimulationModal: TxSimulationModal;
    paginationControl: PaginationControl;
    toastSection: ToastSection;
    clipboard: ClipboardFixture;
    evoluClient: EvoluClient;
    perf: {
        /**
         * Wraps an interaction a desktop test already performs and holds it to the limits of its
         * scenario. Returns null where instrumentation is not installed (e.g. web).
         */
        measure: (
            scenario: string,
            interaction: () => Promise<void>,
        ) => Promise<PerfMetrics | null>;
    };
};

const test = suiteBaseTest.extend<Fixtures>({
    activityPage: async ({ page }, use) => {
        await use(new ActivityPage(page));
    },
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
    tradingPage: async ({ page, devicePrompt, target }, use) => {
        await use(new TradingPage(page, devicePrompt, target));
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
        const solanaStakingMock = new SolanaStakingMock(page);
        await solanaStakingMock.start();
        await use(solanaStakingMock);
        await solanaStakingMock.stop();
    },
    tradingMock: async ({ page }, use) => {
        await use(new TradingMock(page));
    },
    tradingMockNew: async ({ page }, use) => {
        const tradingMockNew = new TradingMockNew(page);
        await use(tradingMockNew);
        await tradingMockNew.stop();
    },
    tradingResponses: async ({ page }, use) => {
        await use(observeTradingResponses(page));
    },
    connectSelectAccountModal: async ({ page }, use) => {
        await use(new ConnectSelectAccountModal(page));
    },
    connectPermissionsModal: async ({ page }, use) => {
        await use(new ConnectPermissionsModal(page));
    },
    stakingSection: async ({ page }, use) => {
        await use(new StakingSection(page));
    },
    yieldSection: async ({ page }, use) => {
        await use(new YieldSection(page));
    },
    yieldFlowSection: async ({ page }, use) => {
        await use(new YieldFlowSection(page));
    },
    yieldNutshellModal: async ({ page }, use) => {
        await use(new YieldNutshellModal(page));
    },
    yieldConsentModal: async ({ page }, use) => {
        await use(new YieldConsentModal(page));
    },
    yieldMock: async ({ page }, use) => {
        const yieldMock = new YieldMock(page);
        await use(yieldMock);
        await yieldMock.stop();
    },
    txSimulationModal: async ({ page }, use) => {
        await use(new TxSimulationModal(page));
    },
    paginationControl: async ({ page }, use) => {
        await use(new PaginationControl(page));
    },
    toastSection: async ({ page }, use) => {
        await use(new ToastSection(page));
    },
    clipboard: async ({ page, target, webClipboardRead }, use) => {
        if (!isDesktopProject(target) && !webClipboardRead) {
            throw new Error(
                'Reading the clipboard in the web app requires test.use({ webClipboardRead: true }).',
            );
        }
        const clipboard = new ClipboardFixture(page);
        await clipboard.clear();
        await use(clipboard);
    },
    evoluClient: async ({}, use) => {
        await checkEvoluRelayServerRunning();
        const evoluClient = new EvoluClient();
        await use(evoluClient);
        await evoluClient.dispose();
    },
    perf: async ({ page }, use, testInfo) => {
        await use({
            measure: (scenario, interaction) =>
                measurePerformance(page, testInfo, scenario, interaction),
        });
    },
});

export { test };
export { expect } from './testExtends/customMatchers';
