import { PreloadedState } from '@suite-native/state';
import { fireEvent, renderWithStoreProviderAsync } from '@suite-native/test-utils';

import { SelectableNetworkList } from '../SelectableNetworkList';

const getMockPreloadedState = (areTestnetsEnabled: boolean): PreloadedState => ({
    appSettings: {
        areTestnetsEnabled,
    },
});

describe('SelectableNetworkList', () => {
    it('should render mainnet and testnet sections when testnets are enabled', async () => {
        const onSelectItem = jest.fn();
        const { getByText } = await renderWithStoreProviderAsync(
            <SelectableNetworkList onSelectItem={onSelectItem} />,
            { preloadedState: getMockPreloadedState(true) },
        );

        expect(getByText('Select a coin to sync')).toBeTruthy();
        expect(getByText('Testnet coins (have no value – for testing purposes only)')).toBeTruthy();
    });

    it('should split networks into mainnet and testnet sections correctly', async () => {
        const onSelectItem = jest.fn();
        const { getByText } = await renderWithStoreProviderAsync(
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
        const { getByText } = await renderWithStoreProviderAsync(
            <SelectableNetworkList onSelectItem={onSelectItem} />,
            { preloadedState: getMockPreloadedState(true) },
        );

        fireEvent.press(getByText('Bitcoin'));
        expect(onSelectItem).toHaveBeenCalledWith('btc');
        fireEvent.press(getByText('Bitcoin Testnet'));
        expect(onSelectItem).toHaveBeenCalledWith('test');
    });

    it('should not render testnet section when testnets are disabled', async () => {
        const onSelectItem = jest.fn();
        const { getByText, queryByText } = await renderWithStoreProviderAsync(
            <SelectableNetworkList onSelectItem={onSelectItem} />,
            { preloadedState: getMockPreloadedState(false) },
        );

        expect(getByText('Select a coin to sync')).toBeTruthy();
        expect(queryByText('Testnet coins (have no value – for testing purposes only)')).toBeNull();
    });
});
