import { type PreloadedState } from '@suite-native/state';
import { fireEvent, renderWithStoreProvider } from '@suite-native/test-utils-store';

import { SelectableNetworkList } from '../SelectableNetworkList';

const getMockPreloadedState = (areTestnetsEnabled: boolean): PreloadedState => ({
    appSettings: {
        areTestnetsEnabled,
    },
});

describe('SelectableNetworkList', () => {
    it('should render mainnet and testnet sections when testnets are enabled', () => {
        const onSelectItem = jest.fn();
        const { getByText } = renderWithStoreProvider(
            <SelectableNetworkList onSelectItem={onSelectItem} />,
            { preloadedState: getMockPreloadedState(true) },
        );

        expect(getByText('Select a coin to sync')).toBeTruthy();
        expect(getByText('Testnet coins (have no value – for testing purposes only)')).toBeTruthy();
    });

    it('should split networks into mainnet and testnet sections correctly', () => {
        const onSelectItem = jest.fn();
        const { getByText } = renderWithStoreProvider(
            <SelectableNetworkList onSelectItem={onSelectItem} />,
            { preloadedState: getMockPreloadedState(true) },
        );

        expect(getByText('Bitcoin')).toBeTruthy();
        expect(getByText('Ethereum')).toBeTruthy();
        expect(getByText('TEST')).toBeTruthy();
        expect(getByText('Ethereum Sepolia')).toBeTruthy();
    });

    it('should call onSelectItem with correct network symbol when item is pressed', () => {
        const onSelectItem = jest.fn();
        const { getByText } = renderWithStoreProvider(
            <SelectableNetworkList onSelectItem={onSelectItem} />,
            { preloadedState: getMockPreloadedState(true) },
        );

        fireEvent.press(getByText('Bitcoin'));
        expect(onSelectItem).toHaveBeenCalledWith('btc');
        fireEvent.press(getByText('Bitcoin Testnet'));
        expect(onSelectItem).toHaveBeenCalledWith('test');
    });

    it('should not render testnet section when testnets are disabled', () => {
        const onSelectItem = jest.fn();
        const { getByText, queryByText } = renderWithStoreProvider(
            <SelectableNetworkList onSelectItem={onSelectItem} />,
            { preloadedState: getMockPreloadedState(false) },
        );

        expect(getByText('Select a coin to sync')).toBeTruthy();
        expect(queryByText('Testnet coins (have no value – for testing purposes only)')).toBeNull();
    });
});
