import { type ExchangeIssue } from '@suite-common/trading';
import { mockAccountKey } from '@suite-common/wallet-types/mocks';
import { getTranslation } from '@suite-native/intl';
import { userEvent } from '@suite-native/test-utils-store';
import { createPrecomposedTxFinal, mercuryoFixedWorstQuote } from '@suite-native/trading-fixtures';

import { ExchangePreviewIssueBanner } from './ExchangePreviewIssueBanner';
import { useExchangeIssue } from '../../../hooks/exchange/useExchangeIssue';
import {
    type PreloadedStatePartial,
    type TradingTestPreloadedState,
    renderWithTradingProvider,
} from '../../../test-utils/tradingTestUtils';

const mockNavigate = jest.fn();

jest.mock('@react-navigation/native', () => ({
    ...jest.requireActual('@react-navigation/native'),
    useNavigation: () => ({
        navigate: mockNavigate,
    }),
}));

jest.mock('../../../hooks/exchange/useExchangeIssue', () => ({
    useExchangeIssue: jest.fn(),
}));

const mockUseExchangeIssue = jest.mocked(useExchangeIssue);

const highRiskIssue: ExchangeIssue = {
    type: 'high-risk',
    severity: 'critical',
    validation: { riskLevel: 'Malicious', features: [] },
};

const priceImpactIssue: ExchangeIssue = {
    type: 'price-impact',
    severity: 'warning',
    deviation: 0.15,
};

const setIssue = (issue: ExchangeIssue | null, { isSimulationEnabled = true } = {}) => {
    mockUseExchangeIssue.mockReturnValue({
        isSimulationEnabled,
        isSimulationLoading: false,
        issue,
    });
};

const btcAccountKey = mockAccountKey({ symbol: 'btc', descriptor: 'btc1normal' });
const ethAccountKey = mockAccountKey({ symbol: 'eth', descriptor: 'eth1normal' });

describe('ExchangePreviewIssueBanner', () => {
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

    const renderExchangePreviewIssueBanner = ({ onSignTransactionNavigation = jest.fn() } = {}) =>
        renderWithTradingProvider(
            <ExchangePreviewIssueBanner
                onSignTransactionNavigation={onSignTransactionNavigation}
            />,
            { tradeType: 'exchange', overrides: baseOverrides },
        );

    beforeEach(() => {
        jest.clearAllMocks();
        setIssue(null);
    });

    it('renders nothing without an issue', () => {
        const { toJSON } = renderExchangePreviewIssueBanner();

        expect(toJSON()).toBeNull();
    });

    it('renders the price impact issue with a formatted percent', () => {
        setIssue(priceImpactIssue);

        const { getByText } = renderExchangePreviewIssueBanner();

        expect(
            getByText(
                getTranslation('moduleTrading.transactionSimulation.issues.priceImpact.title', {
                    percent: '15%',
                }),
            ),
        ).toBeOnTheScreen();
        expect(
            getByText(
                getTranslation(
                    'moduleTrading.transactionSimulation.issues.priceImpact.description',
                ),
            ),
        ).toBeOnTheScreen();
    });

    it('renders the high-risk issue with its title and description', () => {
        setIssue(highRiskIssue);

        const { getByText } = renderExchangePreviewIssueBanner();

        expect(
            getByText(getTranslation('moduleTrading.transactionSimulation.issues.highRisk.title')),
        ).toBeOnTheScreen();
        expect(
            getByText(
                getTranslation('moduleTrading.transactionSimulation.issues.highRisk.description'),
            ),
        ).toBeOnTheScreen();
    });

    it('renders the combined issue as bullets under the high-risk title', () => {
        setIssue({
            type: 'high-risk-with-price-impact',
            severity: 'critical',
            validation: { riskLevel: 'Malicious', features: [] },
            deviation: 0.99,
        });

        const { getByText } = renderExchangePreviewIssueBanner();

        expect(
            getByText(getTranslation('moduleTrading.transactionSimulation.issues.highRisk.title')),
        ).toBeOnTheScreen();
        expect(
            getByText(
                getTranslation('moduleTrading.transactionSimulation.issues.highRisk.description'),
            ),
        ).toBeOnTheScreen();
        expect(
            getByText(
                getTranslation('moduleTrading.transactionSimulation.issues.priceImpact.title', {
                    percent: '99%',
                }),
            ),
        ).toBeOnTheScreen();
    });

    it('renders the issue without continue anyway when the simulation is disabled', () => {
        setIssue(priceImpactIssue, { isSimulationEnabled: false });

        const { getByText, queryByText } = renderExchangePreviewIssueBanner();

        expect(
            getByText(
                getTranslation('moduleTrading.transactionSimulation.issues.priceImpact.title', {
                    percent: '15%',
                }),
            ),
        ).toBeOnTheScreen();
        expect(
            queryByText(getTranslation('moduleTrading.transactionSimulation.continueAnyway')),
        ).toBeNull();
    });

    it('continues to the outputs review on continue anyway press', async () => {
        const mockOnSignTransactionNavigation = jest.fn();
        setIssue(priceImpactIssue);

        const { getByText } = renderExchangePreviewIssueBanner({
            onSignTransactionNavigation: mockOnSignTransactionNavigation,
        });

        await userEvent.press(
            getByText(getTranslation('moduleTrading.transactionSimulation.continueAnyway')),
        );

        expect(mockNavigate).toHaveBeenCalledWith('TradingExchangeOutputsReview', {
            accountKey: btcAccountKey,
            orderId: mercuryoFixedWorstQuote.orderId,
            tokenContract: '0xa0b86991c6218b36c1d19d4a2e9eb0ce3606eb48',
            flowType: 'swap',
        });
        expect(mockOnSignTransactionNavigation).toHaveBeenCalledTimes(1);
    });
});
