import { AccountKey, TokenAddress } from '@suite-common/wallet-types';
import { renderWithStoreProviderAsync } from '@suite-native/test-utils/store';

import { ReviewOutputsContent, ReviewOutputsContentProps } from '../ReviewOutputsContent';

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
        renderWithStoreProviderAsync(
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

    it('should display loading skeleton when mockDelayedReviewOutputListDisplayFlag is falsy', async () => {
        mockDelayedReviewOutputListDisplayFlag = false;
        const { getByTestId } = await renderReviewOutputsContent({});

        expect(getByTestId('@trading/outputs-review/skeleton')).toBeOnTheScreen();
    });

    it('should display output item list if mockDelayedReviewOutputListDisplayFlag is truthy', async () => {
        const { getByText, queryByTestId } = await renderReviewOutputsContent({});

        // invalid account id is provided, expect error
        expect(getByText(/Account not found/)).toBeOnTheScreen();
        expect(queryByTestId('@trading/outputs-review/skeleton')).not.toBeOnTheScreen();
    });

    it('should not display sign button if transaction is not signed yet', async () => {
        const { queryByTestId } = await renderReviewOutputsContent({});

        expect(queryByTestId('@trading/outputs-review/footer')).not.toBeOnTheScreen();
    });

    it('should display sign button if transaction is signed', async () => {
        mockUseTradingOutputsReviewScreenControls.mockReturnValue({
            isTransactionAlreadySigned: true,
            confirmOnTrezorRef: { current: null },
        });
        const { getByTestId } = await renderReviewOutputsContent({});

        expect(getByTestId('@trading/outputs-review/footer')).toBeOnTheScreen();
    });
});
