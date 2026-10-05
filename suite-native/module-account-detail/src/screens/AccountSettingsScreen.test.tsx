import {
    mockNetworkIcon,
    mockNetworkModule,
    mockNetworkModuleRepository,
} from '@suite-common/networks/mocks';
import { mockSuiteSync } from '@suite-common/suite-sync/mocks';
import { type SuiteSyncDep } from '@suite-common/suite-sync-types';
import { asNetworkSymbol } from '@suite-common/wallet-config';
import { mockWalletAccount } from '@suite-common/wallet-types/mocks';
import { getTranslation } from '@suite-native/intl';
import {
    type AccountDetailStackParamList,
    AccountDetailStackRoutes,
    type RootStackParamList,
    type StackToStackCompositeScreenProps,
} from '@suite-native/navigation';
import { renderWithStoreProvider } from '@suite-native/test-utils-store';
import { type NetworkSymbol } from '@trezor/network-module-types';

import { AccountSettingsScreen } from './AccountSettingsScreen';

const networkModule = mockNetworkModule();
const networkModuleRepository = mockNetworkModuleRepository({
    get: () => networkModule,
    isSupportedNetwork: (_symbol): _symbol is NetworkSymbol => true,
});

jest.mock('@react-navigation/native', () => ({
    ...jest.requireActual('@react-navigation/native'),
    useNavigation: () => ({ navigate: jest.fn(), dispatch: jest.fn(), goBack: jest.fn() }),
    useRoute: () => ({ name: 'AccountSettings', key: 'AccountSettings', params: {} }),
}));

type NavigationProps = StackToStackCompositeScreenProps<
    AccountDetailStackParamList,
    AccountDetailStackRoutes.AccountSettings,
    RootStackParamList
>;

const navigationMock = {} as NavigationProps['navigation'];

const btcAccount = mockWalletAccount({ symbol: asNetworkSymbol('btc') });
const ethAccount = mockWalletAccount({ symbol: asNetworkSymbol('eth') });
const services: SuiteSyncDep = { suiteSync: mockSuiteSync() };

const buildRoute = (accountKey: string) =>
    ({
        key: 'AccountSettings',
        name: AccountDetailStackRoutes.AccountSettings,
        params: { accountKey },
    }) as NavigationProps['route'];

const buildPreloadedState = (account: ReturnType<typeof mockWalletAccount>) => ({
    device: { devices: [], selectedDevice: undefined },
    deviceAuthorization: { deviceAuthorizationStep: 'Idle' },
    messageSystem: {
        config: null,
        currentSequence: 0,
        timestamp: 0,
        validMessages: { banner: [], context: [], modal: [], feature: [] },
        dismissedMessages: {},
        validExperiments: [],
        configSource: 'remote',
        manuallyAddedMessageIds: {},
        manuallyAddedExperimentIds: {},
    },
    suiteSyncData: { wallets: {} },
    wallet: { accounts: [account] },
    suiteSync: { settings: {} },
});

describe('AccountSettingsScreen', () => {
    it('renders Show XPUB button for UTXO account', async () => {
        const { queryAllByText } = await renderWithStoreProvider(
            <AccountSettingsScreen
                route={buildRoute(btcAccount.key)}
                navigation={navigationMock}
            />,
            {
                preloadedState: buildPreloadedState(btcAccount),
                services: {
                    ...services,
                    networks: { networkIcon: mockNetworkIcon(), networkModuleRepository },
                },
            },
        );

        // The text appears in both the trigger button and the XpubQRCodeBottomSheet's show button.
        expect(
            queryAllByText(
                getTranslation(
                    'moduleAccountManagement.accountSettingsScreen.xpubBottomSheet.xpub.showButton',
                ),
            ).length,
        ).toBeGreaterThan(0);
    });

    it('does not render Show XPUB button for address-based account', async () => {
        const { queryByText } = await renderWithStoreProvider(
            <AccountSettingsScreen
                route={buildRoute(ethAccount.key)}
                navigation={navigationMock}
            />,
            {
                preloadedState: buildPreloadedState(ethAccount),
                services: {
                    ...services,
                    networks: { networkIcon: mockNetworkIcon(), networkModuleRepository },
                },
            },
        );

        expect(
            queryByText(
                getTranslation(
                    'moduleAccountManagement.accountSettingsScreen.xpubBottomSheet.xpub.showButton',
                ),
            ),
        ).toBeNull();
    });
});
