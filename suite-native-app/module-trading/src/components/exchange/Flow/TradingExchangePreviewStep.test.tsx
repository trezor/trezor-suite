import { getTranslation } from '@suite-native/intl';
import { screen } from '@suite-native/test-utils-store';
import { mercuryoFixedWorstQuote } from '@suite-native/trading-fixtures';

import { TradingExchangePreviewStep } from './TradingExchangePreviewStep';
import { useExchangePreviewStep } from '../../../hooks/exchange/useExchangePreviewStep';
import { renderWithTradingProvider } from '../../../test-utils/tradingTestUtils';
import { type ExchangePreviewFooterProps } from '../ExchangePreview/ExchangePreviewFooter';
import { type ExchangePreviewViewProps } from '../ExchangePreview/ExchangePreviewView';

jest.mock('../../../hooks/exchange/useExchangePreviewStep', () => ({
    useExchangePreviewStep: jest.fn(),
}));

jest.mock('../ExchangePreview/ExchangePreviewView', () => {
    const { Text } = jest.requireActual('@suite-native/atoms');

    return {
        ExchangePreviewView: ({ isApproved, txnErrorString }: ExchangePreviewViewProps) => (
            <Text>{`Preview view: approved ${isApproved}, error ${txnErrorString}`}</Text>
        ),
    };
});

jest.mock('../ExchangePreview/ExchangePreviewFooter', () => {
    const { Text } = jest.requireActual('@suite-native/atoms');

    return {
        ExchangePreviewFooter: ({ isContinueDisabled }: ExchangePreviewFooterProps) => (
            <Text>{`Preview footer: disabled ${isContinueDisabled}`}</Text>
        ),
    };
});

jest.mock('../ExchangePreview/ExchangePreviewScreenHeader', () => {
    const { Text } = jest.requireActual('@suite-native/atoms');

    return { ExchangePreviewScreenHeader: () => <Text>Preview header</Text> };
});

jest.mock('@react-navigation/native', () => ({
    ...jest.requireActual('@react-navigation/native'),
    useRoute: () => ({ key: 'TradingExchangeFlow', name: 'TradingExchangeFlow', params: {} }),
    useNavigation: () => ({ setOptions: jest.fn() }),
}));

const mockedUseExchangePreviewStep = jest.mocked(useExchangePreviewStep);

const mockPreviewStep = (overrides: Partial<ReturnType<typeof useExchangePreviewStep>> = {}) => {
    mockedUseExchangePreviewStep.mockReturnValue({
        quote: mercuryoFixedWorstQuote,
        errorString: null,
        handleConfirmTrade: jest.fn(),
        onSignTransactionNavigation: jest.fn(),
        ...overrides,
    });
};

describe('TradingExchangePreviewStep', () => {
    const onApprovalRequired = jest.fn();

    const renderStep = () =>
        renderWithTradingProvider(
            <TradingExchangePreviewStep
                approvalStatus="needs_revoke"
                onApprovalRequired={onApprovalRequired}
            />,
            { tradeType: 'exchange' },
        );

    beforeEach(() => {
        jest.clearAllMocks();
        mockPreviewStep();
    });

    it('renders the swap as the last step with the approval as the finished step', async () => {
        await renderStep();

        expect(screen.getByText('Preview header')).toBeOnTheScreen();
        expect(screen.getByText('Preview view: approved true, error null')).toBeOnTheScreen();
        expect(screen.getByText('Preview footer: disabled false')).toBeOnTheScreen();
        expect(screen.getByTestId('@step-cards/finished')).toHaveTextContent(
            getTranslation('moduleTrading.tradingExchangeFlowScreen.stepTitles.approve'),
            { exact: false },
        );
        expect(screen.getByTestId('@step-cards/current')).toHaveTextContent(
            getTranslation('stepCards.stepper', { stepNumber: 3, stepCount: 3 }),
            { exact: false },
        );
        expect(screen.queryByTestId('@step-cards/next')).not.toBeOnTheScreen();
        expect(mockedUseExchangePreviewStep).toHaveBeenCalledWith({ onApprovalRequired });
    });

    it('disables the footer and passes the error to the preview when there is an error', async () => {
        mockPreviewStep({ errorString: 'Insufficient funds' });

        await renderStep();

        expect(
            screen.getByText('Preview view: approved true, error Insufficient funds'),
        ).toBeOnTheScreen();
        expect(screen.getByText('Preview footer: disabled true')).toBeOnTheScreen();
    });
});
