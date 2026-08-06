import { asNetworkSymbol } from '@suite-common/wallet-config';
import { getTranslation } from '@suite-native/intl';
import { renderWithStoreProvider } from '@suite-native/test-utils-store';

import { FeeSummaryRow, type FeeSummaryRowProps } from './FeeSummaryRow';
import { getWalletState } from '../../__fixtures__/walletState';

const btcSymbol = asNetworkSymbol('btc');
const ethSymbol = asNetworkSymbol('eth');

const defaultProps: FeeSummaryRowProps = {
    fee: '1000',
    symbol: btcSymbol,
    networkType: 'bitcoin',
    areFeesLoading: false,
};

describe('FeeSummaryRow', () => {
    const getPreloadedState = () => ({
        wallet: getWalletState(),
    });

    const renderRow = (props: Partial<FeeSummaryRowProps> = {}) =>
        renderWithStoreProvider(<FeeSummaryRow {...defaultProps} {...props} />, {
            preloadedState: getPreloadedState(),
        });

    it('should render fee label for bitcoin', () => {
        const { getByText } = renderRow();

        expect(
            getByText(getTranslation('transactionManagement.fees.description.title.general')),
        ).toBeOnTheScreen();
    });

    it('should render ethereum-specific label for ethereum network', () => {
        const { getByText } = renderRow({ networkType: 'ethereum', symbol: ethSymbol });

        expect(
            getByText(getTranslation('transactionManagement.fees.description.title.ethereum')),
        ).toBeOnTheScreen();
    });

    it('should render custom label when provided', () => {
        const { getByText, queryByText } = renderRow({ label: 'Network fee' });

        expect(getByText('Network fee')).toBeOnTheScreen();
        expect(
            queryByText(getTranslation('transactionManagement.fees.description.title.general')),
        ).toBeNull();
    });

    it('should render fee amount via the crypto amount formatter', () => {
        const { getByTestId } = renderRow();

        expect(getByTestId('@transactionManagement/fee-crypto-amount')).toBeOnTheScreen();
    });
});
