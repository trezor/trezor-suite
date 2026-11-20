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
    isAccountActivation: false,
};

describe('TronFeeSummaryRow', () => {
    const getPreloadedState = () => {
        const walletState = getWalletState();

        return {
            wallet: {
                ...walletState,
                fiat: {
                    ...walletState.fiat,
                    current: {
                        ...walletState.fiat.current,
                        'trx-usd': { rate: 0.3, usdRate: 0.3 },
                    },
                },
            },
        };
    };

    const renderRow = (props: Partial<TronFeeSummaryRowProps> = {}) =>
        renderWithStoreProvider(<TronFeeSummaryRow {...defaultProps} {...props} />, {
            preloadedState: getPreloadedState(),
        });

    it('should render the non-adjustable Tron fee label by default', async () => {
        const { getByText } = await renderRow();

        expect(
            getByText(getTranslation('transactionManagement.fees.description.title.tron')),
        ).toBeOnTheScreen();
    });

    it('should render the info button for regular and account activation fees', async () => {
        const { getByTestId } = await renderRow();

        expect(getByTestId('@transactionManagement/tron-fee-info-button')).toBeOnTheScreen();

        const { getByTestId: getActivationByTestId } = await renderRow({
            isAccountActivation: true,
        });

        expect(
            getActivationByTestId('@transactionManagement/tron-fee-info-button'),
        ).toBeOnTheScreen();
    });

    it('should render the adjustable (Maximum fee) label when supportsAdjustableFees is true', async () => {
        const { getByText } = await renderRow({ supportsAdjustableFees: true });

        expect(
            getByText(getTranslation('transactionManagement.fees.description.title.ethereum')),
        ).toBeOnTheScreen();
    });

    it('should render the resource coverage line when trxBurned and a resourceLabel are present', async () => {
        const { getByText } = await renderRow({ resourceLabel: '120 Energy' });

        expect(getByText('+ 120 Energy')).toBeOnTheScreen();
    });

    it('should NOT render the resource coverage line when trxBurned is null', async () => {
        const { queryByText } = await renderRow({ trxBurned: null, resourceLabel: '120 Energy' });

        expect(queryByText('+ 120 Energy')).toBeNull();
    });

    it('should render fee in both crypto and base currency by default', async () => {
        const { getByTestId } = await renderRow();

        expect(getByTestId('@transactionManagement/tron-fee-crypto-amount')).toBeOnTheScreen();
        expect(getByTestId('@transactionManagement/tron-fee-base-amount')).toBeOnTheScreen();
    });

    it('should render only base currency value when baseValueOnly is true', async () => {
        const { getByTestId, queryByTestId } = await renderRow({ baseValueOnly: true });

        expect(getByTestId('@transactionManagement/tron-fee-base-amount')).toBeOnTheScreen();
        expect(
            queryByTestId('@transactionManagement/tron-fee-crypto-amount'),
        ).not.toBeOnTheScreen();
    });
});
