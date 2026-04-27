import { mockWalletAccount } from '@suite-common/wallet-types/mocks';
import {
    type RootStackParamList,
    RootStackRoutes,
    type StackProps,
} from '@suite-native/navigation';
import { renderWithStoreProvider } from '@suite-native/test-utils-store';

import { AccountSettingsScreen } from '../AccountSettingsScreen';

jest.mock('@react-navigation/native', () => ({
    ...jest.requireActual('@react-navigation/native'),
    useNavigation: () => ({ navigate: jest.fn(), dispatch: jest.fn(), goBack: jest.fn() }),
    useRoute: () => ({ name: 'AccountSettings', key: 'AccountSettings', params: {} }),
}));

const navigationMock = {} as StackProps<
    RootStackParamList,
    RootStackRoutes.AccountSettings
>['navigation'];

const btcAccount = mockWalletAccount({ symbol: 'btc' });
const ethAccount = mockWalletAccount({ symbol: 'eth' });

const buildRoute = (accountKey: string) =>
    ({
        key: 'AccountSettings',
        name: RootStackRoutes.AccountSettings,
        params: { accountKey },
    }) as StackProps<RootStackParamList, RootStackRoutes.AccountSettings>['route'];

const buildPreloadedState = (account: ReturnType<typeof mockWalletAccount>) => ({
    device: { devices: [], selectedDevice: undefined },
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
});

describe('AccountSettingsScreen', () => {
    it('renders Show XPUB button for UTXO account', () => {
        const { queryAllByText } = renderWithStoreProvider(
            <AccountSettingsScreen
                route={buildRoute(btcAccount.key)}
                navigation={navigationMock}
            />,
            { preloadedState: buildPreloadedState(btcAccount) },
        );

        // The text appears in both the trigger button and the XpubQRCodeBottomSheet's show button.
        expect(queryAllByText('Show public key (XPUB)').length).toBeGreaterThan(0);
    });

    it('does not render Show XPUB button for address-based account', () => {
        const { queryByText } = renderWithStoreProvider(
            <AccountSettingsScreen
                route={buildRoute(ethAccount.key)}
                navigation={navigationMock}
            />,
            { preloadedState: buildPreloadedState(ethAccount) },
        );

        expect(queryByText('Show public key (XPUB)')).toBeNull();
    });
});
