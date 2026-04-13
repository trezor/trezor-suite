import { Text } from 'react-native';

import { renderWithStoreProvider } from '@suite-native/test-utils-store';
import { btc1NormalAccount } from '@suite-native/trading-fixtures';

import { NetworkAndAccountCard, type NetworkAndAccountCardProps } from '../NetworkAndAccountCard';

describe('NetworkAndAccountCard', () => {
    const renderNetworkAndAccountCard = (props: Partial<NetworkAndAccountCardProps>) =>
        renderWithStoreProvider(
            <NetworkAndAccountCard title="TITLE" account={btc1NormalAccount} {...props} />,
            { preloadedState: { wallet: { accounts: [btc1NormalAccount] } } },
        );

    it('should render title, network name and account label', () => {
        const { getByText, getByHintText } = renderNetworkAndAccountCard({});

        expect(getByText('TITLE')).toBeOnTheScreen();
        expect(getByHintText('Network Icon')).toBeOnTheScreen();
        expect(getByText('BTC Account #1')).toBeOnTheScreen();
    });

    it('should render children', () => {
        const { getByText } = renderNetworkAndAccountCard({
            children: <Text>CHILDREN</Text>,
        });

        expect(getByText('CHILDREN')).toBeOnTheScreen();
    });
});
