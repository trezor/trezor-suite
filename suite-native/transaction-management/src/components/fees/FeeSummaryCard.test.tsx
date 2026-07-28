import { getTranslation } from '@suite-native/intl';
import { renderWithStoreProvider } from '@suite-native/test-utils-store';

import { FeeSummaryCard, type FeeSummaryCardProps } from './FeeSummaryCard';
import { getWalletState } from '../../__fixtures__/walletState';

const defaultProps: FeeSummaryCardProps = {
    fee: '1000',
    symbol: 'btc',
    networkType: 'bitcoin',
    areFeesLoading: false,
    onPress: jest.fn(),
    testID: '@test/fee-summary-card',
};

describe('FeeSummaryCard', () => {
    const getPreloadedState = () => ({
        wallet: getWalletState(),
    });

    const renderCard = (props: Partial<typeof defaultProps> = {}) =>
        renderWithStoreProvider(<FeeSummaryCard {...defaultProps} {...props} />, {
            preloadedState: getPreloadedState(),
        });

    it('should render fee label for bitcoin', () => {
        const { getByText } = renderCard();

        expect(
            getByText(getTranslation('transactionManagement.fees.description.title.general')),
        ).toBeTruthy();
    });

    it('should render ethereum-specific label for ethereum network', () => {
        const { getByText } = renderCard({ networkType: 'ethereum', symbol: 'eth' });

        expect(
            getByText(getTranslation('transactionManagement.fees.description.title.ethereum')),
        ).toBeTruthy();
    });

    it('should render pressable card with testID', () => {
        const { getByTestId } = renderCard();

        expect(getByTestId('@test/fee-summary-card')).toBeTruthy();
    });
});
