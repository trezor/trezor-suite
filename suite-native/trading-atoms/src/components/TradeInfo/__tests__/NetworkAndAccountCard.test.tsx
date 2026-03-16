import { Text } from 'react-native';

import { renderWithBasicProvider } from '@suite-native/test-utils';

import { NetworkAndAccountCard, type NetworkAndAccountCardProps } from '../NetworkAndAccountCard';

describe('NetworkAndAccountCard', () => {
    const renderNetworkAndAccountCard = (props: Partial<NetworkAndAccountCardProps>) =>
        renderWithBasicProvider(
            <NetworkAndAccountCard
                title="TITLE"
                accountLabel="BTC Account"
                symbol="btc"
                {...props}
            />,
        );

    it('should render title, network name and account label', () => {
        const { getByText } = renderNetworkAndAccountCard({});

        expect(getByText('TITLE')).toBeOnTheScreen();
        expect(getByText('Bitcoin')).toBeOnTheScreen();
        expect(getByText('BTC Account')).toBeOnTheScreen();
    });

    it('should render children', () => {
        const { getByText } = renderNetworkAndAccountCard({
            children: <Text>CHILDREN</Text>,
        });

        expect(getByText('CHILDREN')).toBeOnTheScreen();
    });
});
