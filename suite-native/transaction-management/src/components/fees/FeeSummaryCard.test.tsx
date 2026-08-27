import { asNetworkSymbol } from '@suite-common/wallet-config';
import { getTranslation } from '@suite-native/intl';
import { renderWithStoreProvider } from '@suite-native/test-utils-store';

import { FeeSummaryCard, type FeeSummaryCardProps } from './FeeSummaryCard';
import { getWalletState } from '../../__fixtures__/walletState';

const btcSymbol = asNetworkSymbol('btc');
const ethSymbol = asNetworkSymbol('eth');

const defaultProps: FeeSummaryCardProps = {
    fee: '1000',
    symbol: btcSymbol,
    networkType: 'bitcoin',
    areFeesLoading: false,
    onPress: jest.fn(),
    testID: '@test/fee-summary-card',
};

describe('FeeSummaryCard', () => {
    const getPreloadedState = () => ({
        wallet: getWalletState(),
    });

    const renderCard = async (props: Partial<typeof defaultProps> = {}) =>
        await renderWithStoreProvider(<FeeSummaryCard {...defaultProps} {...props} />, {
            preloadedState: getPreloadedState(),
        });

    it('should render fee label for bitcoin', async () => {
        const { getByText } = await renderCard();

        expect(
            getByText(getTranslation('transactionManagement.fees.description.title.general')),
        ).toBeTruthy();
    });

    it('should render ethereum-specific label for ethereum network', async () => {
        const { getByText } = await renderCard({ networkType: 'ethereum', symbol: ethSymbol });

        expect(
            getByText(getTranslation('transactionManagement.fees.description.title.ethereum')),
        ).toBeTruthy();
    });

    it('should render pressable card with testID', async () => {
        const { getByTestId } = await renderCard();

        expect(getByTestId('@test/fee-summary-card')).toBeTruthy();
    });
});
