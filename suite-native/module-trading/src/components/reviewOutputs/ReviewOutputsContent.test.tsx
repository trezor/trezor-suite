import { type TokenAddress } from '@suite-common/wallet-types';
import { mockAccountKey } from '@suite-common/wallet-types/mocks';

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
        mockUseTradingOutputsReviewScreenControls.mockReturnValue({
            isTransactionAlreadySigned: false,
            confirmOnTrezorRef: { current: null },
        });
    });

    it('should not display footer if transaction is not signed yet', () => {
        const { queryByTestId } = renderReviewOutputsContent({});

        expect(queryByTestId('@trading/outputs-review/footer')).not.toBeOnTheScreen();
    });

    it('should display footer if transaction is signed', () => {
        mockUseTradingOutputsReviewScreenControls.mockReturnValue({
            isTransactionAlreadySigned: true,
            confirmOnTrezorRef: { current: null },
        });
        const { getByTestId } = renderReviewOutputsContent({});

        expect(getByTestId('@trading/outputs-review/footer')).toBeOnTheScreen();
    });
});
