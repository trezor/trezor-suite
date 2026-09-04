import { type ExchangeIssue } from '@suite-common/trading';
import { asNetworkSymbol } from '@suite-common/wallet-config';
import { mockAccountKey } from '@suite-common/wallet-types/mocks';
import { type NativeAnalyticsDep } from '@suite-native/analytics';
import { mockNativeAnalytics } from '@suite-native/analytics/mocks';
import { getTranslation } from '@suite-native/intl';
import { userEvent } from '@suite-native/test-utils-store';
import { createPrecomposedTxFinal, mercuryoFixedWorstQuote } from '@suite-native/trading-fixtures';
import { mergeDeepObject } from '@trezor/utils';

import { ExchangePreviewFooter } from './ExchangePreviewFooter';
import { useExchangeIssue } from '../../../hooks/exchange/useExchangeIssue';
import {
    type PreloadedStatePartial,
    type TradingTestPreloadedState,
    renderWithTradingProvider,
} from '../../../test-utils/tradingTestUtils';

const btcSymbol = asNetworkSymbol('btc');
const ethSymbol = asNetworkSymbol('eth');

const mockNavigate = jest.fn();
const mockPopToTop = jest.fn();
const services: NativeAnalyticsDep = { analytics: mockNativeAnalytics() };

jest.mock('@react-navigation/native', () => ({
    ...jest.requireActual('@react-navigation/native'),
    useNavigation: () => ({
        navigate: mockNavigate,
        popToTop: mockPopToTop,
    }),
}));

jest.mock('../../../hooks/exchange/useExchangeIssue', () => ({
    useExchangeIssue: jest.fn(),
}));

const mockUseExchangeIssue = jest.mocked(useExchangeIssue);

const priceImpactIssue: ExchangeIssue = {
    type: 'price-impact',
    severity: 'warning',
    deviation: 0.15,
};

const setIssue = (issue: ExchangeIssue | null) => {
    mockUseExchangeIssue.mockReturnValue({
        isSimulationEnabled: true,
        isSimulationLoading: false,
        isSimulation: true,
        issue,
    });
};

const btcAccountKey = mockAccountKey({ symbol: btcSymbol, descriptor: 'btc1normal' });
const ethAccountKey = mockAccountKey({ symbol: ethSymbol, descriptor: 'eth1normal' });

describe('ExchangePreviewFooter', () => {
    const baseOverrides: PreloadedStatePartial<TradingTestPreloadedState> = {
        wallet: {
            trading: {
                exchange: {
                    tradingAccountKey: btcAccountKey,
                    receiveAccountKey: ethAccountKey,
                    selectedQuote: mercuryoFixedWorstQuote,
                },
            },
            send: {
                precomposedTx: createPrecomposedTxFinal({
                    totalSpent: '1100',
                    fee: '1000',
                    feePerByte: '100',
                    bytes: 1,
                }),
            },
        },
    };

    const renderExchangePreviewFooter = async (
        extraOverrides: PreloadedStatePartial<TradingTestPreloadedState> = {},
    ) =>
        await renderWithTradingProvider(
            <ExchangePreviewFooter
                isContinueDisabled={false}
                onSignTransactionNavigation={jest.fn()}
            />,
            {
                tradeType: 'exchange',
                overrides: mergeDeepObject(baseOverrides, extraOverrides),
                services,
            },
        );

    beforeEach(() => {
        jest.clearAllMocks();
        setIssue(null);
    });

    it('renders the continue button without an issue', async () => {
        const { getByTestId, queryByTestId } = await renderExchangePreviewFooter();

        expect(getByTestId('@trading/exchange-preview/continue-button')).toBeOnTheScreen();
        expect(queryByTestId('@trading/exchange-preview/back-to-form-button')).toBeNull();
    });

    it('replaces the continue button with back to trade form on an issue', async () => {
        setIssue(priceImpactIssue);

        const { getByTestId, queryByTestId } = await renderExchangePreviewFooter();

        expect(getByTestId('@trading/exchange-preview/back-to-form-button')).toBeOnTheScreen();
        expect(queryByTestId('@trading/exchange-preview/continue-button')).toBeNull();
    });

    it('pops back to the trade form on back press', async () => {
        setIssue(priceImpactIssue);

        const { getByText } = await renderExchangePreviewFooter();

        await userEvent.press(
            getByText(getTranslation('moduleTrading.transactionSimulation.backToTradeForm')),
        );

        expect(mockPopToTop).toHaveBeenCalledTimes(1);
        expect(mockNavigate).not.toHaveBeenCalled();
    });

    it('renders nothing when the trade is finalized despite an issue', async () => {
        setIssue(priceImpactIssue);

        const { toJSON } = await renderExchangePreviewFooter({
            wallet: {
                trading: {
                    exchange: {
                        selectedQuote: { ...mercuryoFixedWorstQuote, status: 'SUCCESS' },
                    },
                },
            },
        });

        expect(toJSON()).toBeNull();
    });
});
