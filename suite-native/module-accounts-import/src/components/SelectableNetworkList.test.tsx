import {
    mockNetworksState,
    mockNetworkIcon,
    mockNetworkModule,
    mockNetworkModuleRepository,
} from '@suite-common/networks/mocks';
import { mockGetSupportedNetworks } from '@suite-common/wallet-config/mocks';
import { fireEvent, renderWithStoreProvider } from '@suite-native/test-utils-store';
import { type NetworkSymbol } from '@trezor/network-module-types';

import { SelectableNetworkList } from './SelectableNetworkList';

const networkModule = mockNetworkModule();
const networkModuleRepository = mockNetworkModuleRepository({
    get: () => networkModule,
    isSupportedNetwork: (_symbol): _symbol is NetworkSymbol => true,
});

const getMockPreloadedState = (areTestnetsEnabled: boolean) => ({
    networks: mockNetworksState(mockGetSupportedNetworks()),
    appSettings: {
        areTestnetsEnabled,
    },
    device: { selectedDevice: undefined, devices: [] },
    featureFlags: {},
});

describe('SelectableNetworkList', () => {
    it('should render mainnet and testnet sections when testnets are enabled', async () => {
        const onSelectItem = jest.fn();
        const { getByText } = await renderWithStoreProvider(
            <SelectableNetworkList onSelectItem={onSelectItem} />,
            {
                preloadedState: getMockPreloadedState(true),
                services: { networks: { networkIcon: mockNetworkIcon(), networkModuleRepository } },
            },
        );

        expect(getByText('Select a network to sync')).toBeTruthy();
        expect(getByText('Testnet networks (no value–for testing purposes only)')).toBeTruthy();
    });

    it('should split networks into mainnet and testnet sections correctly', async () => {
        const onSelectItem = jest.fn();
        const { getByText } = await renderWithStoreProvider(
            <SelectableNetworkList onSelectItem={onSelectItem} />,
            {
                preloadedState: getMockPreloadedState(true),
                services: { networks: { networkIcon: mockNetworkIcon(), networkModuleRepository } },
            },
        );

        expect(getByText('Bitcoin')).toBeTruthy();
        expect(getByText('Ethereum')).toBeTruthy();
        expect(getByText('TEST')).toBeTruthy();
        expect(getByText('Ethereum Sepolia')).toBeTruthy();
    });

    it('should call onSelectItem with correct network symbol when item is pressed', async () => {
        const onSelectItem = jest.fn();
        const { getByText } = await renderWithStoreProvider(
            <SelectableNetworkList onSelectItem={onSelectItem} />,
            {
                preloadedState: getMockPreloadedState(true),
                services: { networks: { networkIcon: mockNetworkIcon(), networkModuleRepository } },
            },
        );

        await fireEvent.press(getByText('Bitcoin'));
        expect(onSelectItem).toHaveBeenCalledWith('btc');
        await fireEvent.press(getByText('Bitcoin Testnet'));
        expect(onSelectItem).toHaveBeenCalledWith('test');
    });

    it('should not render testnet section when testnets are disabled', async () => {
        const onSelectItem = jest.fn();
        const { getByText, queryByText } = await renderWithStoreProvider(
            <SelectableNetworkList onSelectItem={onSelectItem} />,
            {
                preloadedState: getMockPreloadedState(false),
                services: { networks: { networkIcon: mockNetworkIcon(), networkModuleRepository } },
            },
        );

        expect(getByText('Select a network to sync')).toBeTruthy();
        expect(queryByText('Testnet coins (have no value – for testing purposes only)')).toBeNull();
    });
});
