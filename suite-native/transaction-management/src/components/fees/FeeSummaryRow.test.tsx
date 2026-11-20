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

    it('should render fee label for bitcoin', async () => {
        const { getByText } = await renderRow();

        expect(
            getByText(getTranslation('transactionManagement.fees.description.title.general')),
        ).toBeOnTheScreen();
    });

    it('should render ethereum-specific label for ethereum network', async () => {
        const { getByText } = await renderRow({ networkType: 'ethereum', symbol: ethSymbol });

        expect(
            getByText(getTranslation('transactionManagement.fees.description.title.ethereum')),
        ).toBeOnTheScreen();
    });

    it('should render custom label when provided', async () => {
        const { getByText, queryByText } = await renderRow({ label: 'Network fee' });

        expect(getByText('Network fee')).toBeOnTheScreen();
        expect(
            queryByText(getTranslation('transactionManagement.fees.description.title.general')),
        ).toBeNull();
    });

    it('should render fee amount via the crypto amount formatter', async () => {
        const { getByTestId } = await renderRow();

        expect(getByTestId('@transactionManagement/fee-crypto-amount')).toBeOnTheScreen();
    });

    it('should render fee in base currency', async () => {
        const { getByTestId } = await renderRow();

        expect(getByTestId('@transactionManagement/fee-base-amount')).toBeOnTheScreen();
    });

    it('should render only base currency value when baseValueOnly is true', async () => {
        const { getByTestId, queryByTestId } = await renderRow({ baseValueOnly: true });

        expect(getByTestId('@transactionManagement/fee-base-amount')).toBeOnTheScreen();
        expect(queryByTestId('@transactionManagement/fee-crypto-amount')).not.toBeOnTheScreen();
    });

    it('should not render ≈ when fees are not composed yet', async () => {
        const { queryByText } = await renderRow({ areFeesLoading: true });

        expect(queryByText('≈')).not.toBeOnTheScreen();
    });
});
