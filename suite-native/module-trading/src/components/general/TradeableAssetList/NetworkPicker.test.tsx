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
    selectDiscoverySupportedNetworks: () => mockNetworks,
}));

describe('NetworkPicker', () => {
    const testID = '@trading/test/network-picker';

    const renderNetworkPicker = ({
        selectedNetwork,
        onSelectNetwork = jest.fn(),
    }: {
        selectedNetwork?: Network['symbol'];
        onSelectNetwork?: jest.Mock;
    } = {}) =>
        renderWithTradingProvider(
            <NetworkPicker
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
