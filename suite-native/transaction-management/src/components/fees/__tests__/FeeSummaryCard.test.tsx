import { renderWithStoreProvider } from '@suite-native/test-utils';

import { getWalletState } from '../../../__fixtures__/walletState';
import { FeeSummaryCard } from '../FeeSummaryCard';

describe('FeeSummaryCard', () => {
    const defaultProps = {
        fee: '1000',
        symbol: 'btc' as const,
        networkType: 'bitcoin' as const,
        areFeesLoading: false,
        onPress: jest.fn(),
        testID: '@test/fee-summary-card',
    };

    const getPreloadedState = () => ({
        wallet: getWalletState(),
    });

    const renderCard = (props: Partial<typeof defaultProps> = {}) =>
        renderWithStoreProvider(<FeeSummaryCard {...defaultProps} {...props} />, {
            preloadedState: getPreloadedState(),
        });

    it('should render fee label for bitcoin', () => {
        const { getByText } = renderCard();

        expect(getByText('Transaction fee')).toBeTruthy();
    });

    it('should render ethereum-specific label for ethereum network', () => {
        const { getByText } = renderCard({ networkType: 'ethereum', symbol: 'eth' });

        expect(getByText('Maximum fee')).toBeTruthy();
    });

    it('should render pressable card with testID', () => {
        const { getByTestId } = renderCard();

        expect(getByTestId('@test/fee-summary-card')).toBeTruthy();
    });
});
