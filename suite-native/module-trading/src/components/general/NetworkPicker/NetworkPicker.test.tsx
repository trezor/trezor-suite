import { type Network } from '@suite-common/wallet-config';
import { fireEvent, screen } from '@suite-native/test-utils-store';

import { NetworkPicker } from './NetworkPicker';
import { renderWithTradingProvider } from '../../../test-utils/tradingTestUtils';

const mockNetworks: Network[] = [
    {
        name: 'Bitcoin',
        symbol: 'btc',
    } as Network,
    {
        name: 'Ethereum',
        symbol: 'eth',
    } as Network,
];

jest.mock('@suite-native/discovery', () => ({
    ...jest.requireActual('@suite-native/discovery'),
    selectDeviceEnabledDiscoveryNetworkSymbols: () => ['eth'],
    selectDiscoveryNetworkSymbols: () => mockNetworks.map(({ symbol }) => symbol),
}));

describe('NetworkPicker', () => {
    const testID = '@trading/test/network-picker';

    const renderNetworkPicker = ({
        networkFilterMode,
        selectedNetwork,
        onSelectNetwork = jest.fn(),
    }: {
        networkFilterMode?: 'all-supported' | 'discovered';
        selectedNetwork?: Network['symbol'];
        onSelectNetwork?: jest.Mock;
    } = {}) =>
        renderWithTradingProvider(
            <NetworkPicker
                networkFilterMode={networkFilterMode}
                selectedNetwork={selectedNetwork}
                onSelectNetwork={onSelectNetwork}
                testID={testID}
            />,
        );

    afterEach(() => {
        screen.unmount();
    });

    it('renders the available networks in the sheet', () => {
        const { getByTestId, getByText } = renderNetworkPicker();

        fireEvent.press(getByTestId(testID));

        expect(getByText('Bitcoin')).toBeOnTheScreen();
        expect(getByText('Ethereum')).toBeOnTheScreen();
    });

    it('applies a selected network', () => {
        const onSelectNetwork = jest.fn();
        const { getByTestId } = renderNetworkPicker({ onSelectNetwork });
        fireEvent.press(getByTestId(testID));

        fireEvent.press(getByTestId(`${testID}/networks-sheet/eth`));

        expect(onSelectNetwork).toHaveBeenCalledWith('eth');
    });

    it('renders only discovered networks in discovered mode', () => {
        const { getByTestId, getByText, queryByText } = renderNetworkPicker({
            networkFilterMode: 'discovered',
        });

        fireEvent.press(getByTestId(testID));

        expect(getByText('Ethereum')).toBeOnTheScreen();
        expect(queryByText('Bitcoin')).not.toBeOnTheScreen();
    });

    it('selects all networks', () => {
        const onSelectNetwork = jest.fn();
        const { getByTestId } = renderNetworkPicker({
            selectedNetwork: 'eth',
            onSelectNetwork,
        });
        fireEvent.press(getByTestId(testID));

        fireEvent.press(getByTestId(`${testID}/networks-sheet/all`));

        expect(onSelectNetwork).toHaveBeenCalledWith(undefined);
    });
});
