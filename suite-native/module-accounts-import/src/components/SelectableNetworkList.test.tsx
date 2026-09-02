import { fireEvent, renderWithStoreProvider } from '@suite-native/test-utils-store';

import { SelectableNetworkList } from './SelectableNetworkList';

const getMockPreloadedState = (areTestnetsEnabled: boolean) => ({
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
            { preloadedState: getMockPreloadedState(true) },
        );

        expect(getByText('Select a network to sync')).toBeTruthy();
        expect(getByText('Testnet networks (no value–for testing purposes only)')).toBeTruthy();
    });

    it('should split networks into mainnet and testnet sections correctly', async () => {
        const onSelectItem = jest.fn();
        const { getByText } = await renderWithStoreProvider(
            <SelectableNetworkList onSelectItem={onSelectItem} />,
            { preloadedState: getMockPreloadedState(true) },
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
            { preloadedState: getMockPreloadedState(true) },
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
            { preloadedState: getMockPreloadedState(false) },
        );

        expect(getByText('Select a network to sync')).toBeTruthy();
        expect(queryByText('Testnet coins (have no value – for testing purposes only)')).toBeNull();
    });
});
