import { type TokenAddress } from '@suite-common/wallet-types';
import { mockAccountKey } from '@suite-common/wallet-types/mocks';
import { getTranslation } from '@suite-native/intl';

import { ReviewOutputsContent, type ReviewOutputsContentProps } from './ReviewOutputsContent';
import { renderWithTradingProvider } from '../../test-utils/tradingTestUtils';

jest.mock('@suite-native/confirm-on-trezor', () => ({
    ...jest.requireActual('@suite-native/confirm-on-trezor'),
    useConfirmOnTrezorController: () => ({
        confirmOnTrezorRef: { current: null },
        closeSheet: jest.fn(),
    }),
    ConfirmOnTrezorWrapper: ({ children }: { children: React.ReactNode }) => <>{children}</>,
}));

const mockUseTradingOutputsReviewScreenControls = jest.fn();

jest.mock('../../hooks/reviewOutputs/useTradingOutputsReviewScreenControls', () => ({
    useTradingOutputsReviewScreenControls: (args: any) =>
        mockUseTradingOutputsReviewScreenControls(args),
}));

jest.mock('../../hooks/reviewOutputs/useDelayedReviewOutputListDisplayFlag', () => ({
    useDelayedReviewOutputListDisplayFlag: () => true,
}));

jest.mock('./ReviewOutputsBody', () => ({
    ReviewOutputsBody: () => null,
}));

describe('ReviewOutputsContent', () => {
    const renderReviewOutputsContent = async (
        props: Partial<Omit<ReviewOutputsContentProps, 'exchangeFlowType' | 'tradingType'>>,
    ) =>
        await renderWithTradingProvider(
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
        mockUseTradingOutputsReviewScreenControls.mockReturnValue({
            isTransactionAlreadySigned: false,
            confirmOnTrezorRef: { current: null },
            showTimer: false,
            secondsLeft: 0,
            isPastDeadline: false,
            isBroadcasting: false,
            onRetry: jest.fn(),
            isRetryDisabled: false,
            handleSendTransaction: jest.fn(),
        });
    });

    it('should not display footer if transaction is not signed yet', async () => {
        const { queryByTestId } = await renderReviewOutputsContent({});

        expect(queryByTestId('@trading/outputs-review/footer')).not.toBeOnTheScreen();
    });

    it('should display footer if transaction is signed', async () => {
        mockUseTradingOutputsReviewScreenControls.mockReturnValue({
            isTransactionAlreadySigned: true,
            confirmOnTrezorRef: { current: null },
            showTimer: false,
            secondsLeft: 0,
            isPastDeadline: false,
            isBroadcasting: false,
            onRetry: jest.fn(),
            isRetryDisabled: false,
            handleSendTransaction: jest.fn(),
        });
        const { getByTestId } = await renderReviewOutputsContent({});

        expect(getByTestId('@trading/outputs-review/footer')).toBeOnTheScreen();
    });

    it('should display the transaction validity timer', async () => {
        mockUseTradingOutputsReviewScreenControls.mockReturnValue({
            isTransactionAlreadySigned: true,
            confirmOnTrezorRef: { current: null },
            showTimer: true,
            secondsLeft: 30,
            isPastDeadline: false,
            isBroadcasting: false,
            onRetry: jest.fn(),
            isRetryDisabled: false,
            handleSendTransaction: jest.fn(),
        });

        const { getByText } = await renderReviewOutputsContent({});

        expect(
            getByText(
                getTranslation('transactionManagement.txValidityTimer.countdown', {
                    seconds: 30,
                }),
            ),
        ).toBeOnTheScreen();
    });
});
