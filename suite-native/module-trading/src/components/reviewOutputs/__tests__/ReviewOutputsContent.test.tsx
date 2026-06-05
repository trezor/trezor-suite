import { type AccountKey, type TokenAddress } from '@suite-common/wallet-types';
import { mockAccountKey } from '@suite-common/wallet-types/mocks';
import { oneInchFusionPlusWithEip712SignDataQuote } from '@suite-native/trading-fixtures';

import { renderWithTradingProvider } from '../../../__tests__/tradingTestUtils';
import { ReviewOutputsContent, type ReviewOutputsContentProps } from '../ReviewOutputsContent';

jest.mock('@suite-native/confirm-on-trezor', () => ({
    ...jest.requireActual('@suite-native/confirm-on-trezor'),
    useConfirmOnTrezorController: () => ({
        confirmOnTrezorRef: { current: null },
        closeSheet: jest.fn(),
    }),
    ConfirmOnTrezorWrapper: ({ children }: { children: React.ReactNode }) => <>{children}</>,
}));

const mockUseTradingOutputsReviewScreenControls = jest.fn();

jest.mock('../../../hooks/reviewOutputs/useTradingOutputsReviewScreenControls', () => ({
    useTradingOutputsReviewScreenControls: (args: any) =>
        mockUseTradingOutputsReviewScreenControls(args),
}));

let mockDelayedReviewOutputListDisplayFlag: boolean;

jest.mock('../../../hooks/reviewOutputs/useDelayedReviewOutputListDisplayFlag', () => ({
    useDelayedReviewOutputListDisplayFlag: () => mockDelayedReviewOutputListDisplayFlag,
}));

describe('ReviewOutputsContent', () => {
    const renderReviewOutputsContent = (
        props: Partial<Omit<ReviewOutputsContentProps, 'exchangeFlowType' | 'tradingType'>>,
    ) =>
        renderWithTradingProvider(
            <ReviewOutputsContent
                orderId="ORDER_ID"
                accountKey={mockAccountKey({ descriptor: 'accountKey' })}
                reportToAnalytics={jest.fn()}
                tradingType="exchange"
                isTransactionSendConsentRequested={true}
                tokenContract={'TOKEN_CONTRACT' as TokenAddress}
                resolveTransactionSendConsent={jest.fn()}
                signAndSendTransaction={jest.fn()}
                exchangeFlowType="swap"
                {...props}
            />,
        );

    beforeEach(() => {
        jest.clearAllMocks();
        mockDelayedReviewOutputListDisplayFlag = true;
        mockUseTradingOutputsReviewScreenControls.mockReturnValue({
            isTransactionAlreadySigned: false,
            confirmOnTrezorRef: { current: null },
        });
    });

    it('should display loading skeleton when mockDelayedReviewOutputListDisplayFlag is falsy', () => {
        mockDelayedReviewOutputListDisplayFlag = false;
        const { getByTestId } = renderReviewOutputsContent({});

        expect(getByTestId('@trading/outputs-review/skeleton')).toBeOnTheScreen();
    });

    it('should display output item list if mockDelayedReviewOutputListDisplayFlag is truthy', () => {
        const { getByText, queryByTestId } = renderReviewOutputsContent({});

        // invalid account id is provided, expect error
        expect(getByText(/Account not found/)).toBeOnTheScreen();
        expect(queryByTestId('@trading/outputs-review/skeleton')).not.toBeOnTheScreen();
    });

    it('should not display sign button if transaction is not signed yet', () => {
        const { queryByTestId } = renderReviewOutputsContent({});

        expect(queryByTestId('@trading/outputs-review/footer')).not.toBeOnTheScreen();
    });

    it('should render SignDataMessageReview when exchangeFlowType is sign-data', () => {
        const { getByTestId, getByText, queryByText } = renderWithTradingProvider(
            <ReviewOutputsContent
                orderId="ORDER_ID"
                accountKey={'ACCOUNT_KEY' as AccountKey}
                reportToAnalytics={jest.fn()}
                tradingType="exchange"
                isTransactionSendConsentRequested={true}
                tokenContract={'TOKEN_CONTRACT' as TokenAddress}
                resolveTransactionSendConsent={jest.fn()}
                signAndSendTransaction={jest.fn()}
                exchangeFlowType="sign-data"
            />,
            {
                tradeType: 'exchange',
                overrides: {
                    wallet: {
                        trading: {
                            exchange: {
                                selectedQuote: oneInchFusionPlusWithEip712SignDataQuote,
                            },
                        },
                    },
                },
            },
        );

        expect(getByTestId('@trading/outputs-review')).toBeOnTheScreen();
        expect(getByText('Sign EIP-712 typed data')).toBeOnTheScreen();
        // ReviewOutputItemList renders "Account not found" for invalid keys; sign-data skips it
        expect(queryByText(/Account not found/)).toBeNull();
    });

    it('should display sign button if transaction is signed', () => {
        mockUseTradingOutputsReviewScreenControls.mockReturnValue({
            isTransactionAlreadySigned: true,
            confirmOnTrezorRef: { current: null },
        });
        const { getByTestId } = renderReviewOutputsContent({});

        expect(getByTestId('@trading/outputs-review/footer')).toBeOnTheScreen();
    });
});
