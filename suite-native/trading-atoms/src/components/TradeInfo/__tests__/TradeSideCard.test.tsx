import { Text } from 'react-native';

import type { CryptoId } from 'invity-api';

import { renderWithStoreProvider } from '@suite-native/test-utils';
import { btc1NormalAccount } from '@suite-native/trading-fixtures';

import { TradeSideCard, type TradeSideCardProps } from '../TradeSideCard';

describe('TradeSideCard', () => {
    const renderTradeSideCard = (props: Partial<TradeSideCardProps>) =>
        renderWithStoreProvider(
            <TradeSideCard
                account={btc1NormalAccount}
                amount={<Text>AMOUNT</Text>}
                title={<Text>TITLE</Text>}
                {...props}
            />,
            { preloadedState: { wallet: { accounts: [btc1NormalAccount] } } },
        );

    it('should render nothing when no cryptoId is specified', () => {
        const { toJSON } = renderTradeSideCard({});

        expect(toJSON()).toBeNull();
    });

    it('should render title, amount and account label', () => {
        const { getByText } = renderTradeSideCard({ cryptoId: 'bitcoin' as CryptoId });

        expect(getByText('TITLE')).toBeOnTheScreen();
        expect(getByText('AMOUNT')).toBeOnTheScreen();
        expect(getByText('BTC Account #1')).toBeOnTheScreen();
    });

    it('should render children when provided', () => {
        const { getByText } = renderTradeSideCard({
            cryptoId: 'bitcoin' as CryptoId,
            children: <Text>CHILDREN</Text>,
        });

        expect(getByText('CHILDREN')).toBeOnTheScreen();
    });
});
