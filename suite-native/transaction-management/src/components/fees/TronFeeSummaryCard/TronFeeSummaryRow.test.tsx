import { asNetworkSymbol } from '@suite-common/wallet-config';
import { getTranslation } from '@suite-native/intl';
import { renderWithStoreProvider } from '@suite-native/test-utils-store';

import { TronFeeSummaryRow, type TronFeeSummaryRowProps } from './TronFeeSummaryRow';
import { getWalletState } from '../../../__fixtures__/walletState';

const trxSymbol = asNetworkSymbol('trx');

const defaultProps: TronFeeSummaryRowProps = {
    symbol: trxSymbol,
    networkType: 'tron',
    supportsAdjustableFees: false,
    trxBurned: '1000000',
    areFeesLoading: false,
    resourceLabel: '',
};

describe('TronFeeSummaryRow', () => {
    const getPreloadedState = () => ({
        wallet: getWalletState(),
    });

    const renderRow = (props: Partial<TronFeeSummaryRowProps> = {}) =>
        renderWithStoreProvider(<TronFeeSummaryRow {...defaultProps} {...props} />, {
            preloadedState: getPreloadedState(),
        });

    it('should render the non-adjustable Tron fee label by default', () => {
        const { getByText } = renderRow();

        expect(
            getByText(getTranslation('transactionManagement.fees.description.title.tron')),
        ).toBeOnTheScreen();
    });

    it('should render the adjustable (Maximum fee) label when supportsAdjustableFees is true', () => {
        const { getByText } = renderRow({ supportsAdjustableFees: true });

        expect(
            getByText(getTranslation('transactionManagement.fees.description.title.ethereum')),
        ).toBeOnTheScreen();
    });

    it('should render the resource coverage line when trxBurned and a resourceLabel are present', () => {
        const { getByText } = renderRow({ resourceLabel: '120 Energy' });

        expect(getByText('+ 120 Energy')).toBeOnTheScreen();
    });

    it('should NOT render the resource coverage line when trxBurned is null', () => {
        const { queryByText } = renderRow({ trxBurned: null, resourceLabel: '120 Energy' });

        expect(queryByText('+ 120 Energy')).toBeNull();
    });
});
