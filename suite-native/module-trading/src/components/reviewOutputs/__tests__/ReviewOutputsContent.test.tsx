import { type AccountKey, type TokenAddress } from '@suite-common/wallet-types';
import { renderWithStoreProvider } from '@suite-native/test-utils';

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
    const renderReviewOutputsContent = (props: Partial<ReviewOutputsContentProps>) =>
        renderWithStoreProvider(
            <ReviewOutputsContent
                orderId="ORDER_ID"
                accountKey={
                    'ACCOUNT_KEY' as AccountKey // Todo: create properly via `createAccountKey()`
                }
                reportToAnalytics={jest.fn()}
                tradingType="exchange"
                isTransactionSendConsentRequested={true}
                tokenContract={'TOKEN_CONTRACT' as TokenAddress}
                resolveTransactionSendConsent={jest.fn()}
                signAndSendTransaction={jest.fn()}
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

    it('should display sign button if transaction is signed', () => {
        mockUseTradingOutputsReviewScreenControls.mockReturnValue({
            isTransactionAlreadySigned: true,
            confirmOnTrezorRef: { current: null },
        });
        const { getByTestId } = renderReviewOutputsContent({});

        expect(getByTestId('@trading/outputs-review/footer')).toBeOnTheScreen();
    });
});
