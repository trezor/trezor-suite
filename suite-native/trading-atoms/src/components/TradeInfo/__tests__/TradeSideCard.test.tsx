import { Text } from 'react-native';

import type { CryptoId } from 'invity-api';

import { renderWithBasicProvider } from '@suite-native/test-utils';

import { TradeSideCard, type TradeSideCardProps } from '../TradeSideCard';

describe('TradeSideCard', () => {
    const renderTradeSideCard = (props: Partial<TradeSideCardProps>) =>
        renderWithBasicProvider(
            <TradeSideCard
                amount={<Text>AMOUNT</Text>}
                title={<Text>TITLE</Text>}
                accountLabel="ACCOUNT LABEL"
                {...props}
            />,
        );

    it('should render nothing when no cryptoId is specified', () => {
        const { toJSON } = renderTradeSideCard({});

        expect(toJSON()).toBeNull();
    });

    it('should render title, amount and account label', () => {
        const { getByText } = renderTradeSideCard({ cryptoId: 'bitcoin' as CryptoId });

        expect(getByText('TITLE')).toBeOnTheScreen();
        expect(getByText('AMOUNT')).toBeOnTheScreen();
        expect(getByText('ACCOUNT LABEL')).toBeOnTheScreen();
    });

    it('should render children when provided', () => {
        const { getByText } = renderTradeSideCard({
            cryptoId: 'bitcoin' as CryptoId,
            children: <Text>CHILDREN</Text>,
        });

        expect(getByText('CHILDREN')).toBeOnTheScreen();
    });
});
