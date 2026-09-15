import { type TokenAddress } from '@suite-common/wallet-types';
import { mockAccountKey } from '@suite-common/wallet-types/mocks';
import { getTranslation } from '@suite-native/intl';
import { userEvent } from '@suite-native/test-utils-store';
import {
    btc1NormalAccount,
    oneInchFusionPlusWithEip712SignDataQuote,
} from '@suite-native/trading-fixtures';

import { ReviewOutputsContent, type ReviewOutputsContentProps } from './ReviewOutputsContent';
import { renderWithTradingProvider } from '../../test-utils/tradingTestUtils';

jest.mock('@react-navigation/native', () => ({
    ...jest.requireActual('@react-navigation/native'),
    useNavigation: () => ({
        navigate: jest.fn(),
        goBack: jest.fn(),
        popToTop: jest.fn(),
        popTo: jest.fn(),
        dispatch: jest.fn(),
        canGoBack: () => false,
        getState: () => ({ routes: [] }),
        addListener: jest.fn(() => jest.fn()),
    }),
    usePreventRemove: jest.fn(),
}));

jest.mock('@suite-native/confirm-on-trezor', () => ({
    ...jest.requireActual('@suite-native/confirm-on-trezor'),
    useConfirmOnTrezorController: () => ({
        confirmOnTrezorRef: { current: null },
        closeSheet: jest.fn(),
        revealConfirmOnTrezorSheet: jest.fn(),
    }),
    ConfirmOnTrezorWrapper: ({ children }: { children: React.ReactNode }) => <>{children}</>,
}));

const mockUseTradingOutputsReviewScreenControls = jest.fn();

jest.mock('../../hooks/reviewOutputs/useTradingOutputsReviewScreenControls', () => ({
    useTradingOutputsReviewScreenControls: (args: any) =>
        mockUseTradingOutputsReviewScreenControls(args),
}));

const mockUseDelayedReviewOutputListDisplayFlag = jest.fn(() => true);

jest.mock('../../hooks/reviewOutputs/useDelayedReviewOutputListDisplayFlag', () => ({
    useDelayedReviewOutputListDisplayFlag: () => mockUseDelayedReviewOutputListDisplayFlag(),
}));

const createControlsMockValue = (overrides: Record<string, unknown> = {}) => ({
    isTransactionAlreadySigned: false,
    confirmOnTrezorRef: { current: null },
    closeSheet: jest.fn(),
    revealConfirmOnTrezorSheet: jest.fn(),
    showTimer: false,
    secondsLeft: 0,
    isPastDeadline: false,
    isBroadcasting: false,
    onRetry: jest.fn(),
    isRetryDisabled: false,
    handleSendTransaction: jest.fn(),
    ...overrides,
});

describe('ReviewOutputsContent', () => {
    const renderReviewOutputsContent = async (
        props: Partial<Omit<ReviewOutputsContentProps, 'exchangeFlowType' | 'tradingType'>> & {
            exchangeFlowType?: ReviewOutputsContentProps['exchangeFlowType'];
        } = {},
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
            { tradeType: 'exchange' },
        );

    beforeEach(() => {
        jest.clearAllMocks();
        mockUseDelayedReviewOutputListDisplayFlag.mockReturnValue(true);
        mockUseTradingOutputsReviewScreenControls.mockReturnValue(createControlsMockValue());
    });

    it('should not display footer if transaction is not signed yet', async () => {
        const { queryByTestId } = await renderReviewOutputsContent();

        expect(queryByTestId('@trading/outputs-review/footer')).not.toBeOnTheScreen();
    });

    it('should display footer if transaction is signed', async () => {
        mockUseTradingOutputsReviewScreenControls.mockReturnValue(
            createControlsMockValue({ isTransactionAlreadySigned: true }),
        );
        const { getByTestId } = await renderReviewOutputsContent({
            accountKey: btc1NormalAccount.key,
        });

        expect(getByTestId('@trading/outputs-review/footer')).toBeOnTheScreen();
        expect(getByTestId('@trading/outputs-review/footer/submit-button')).toHaveTextContent(
            getTranslation('moduleTrading.tradingReviewOutputs.submitButton'),
        );
    });

    it('should resolve the send consent on submit button press', async () => {
        const handleSendTransaction = jest.fn();
        mockUseTradingOutputsReviewScreenControls.mockReturnValue(
            createControlsMockValue({ isTransactionAlreadySigned: true, handleSendTransaction }),
        );
        const { getByTestId } = await renderReviewOutputsContent({
            accountKey: btc1NormalAccount.key,
        });

        await userEvent.press(getByTestId('@trading/outputs-review/footer/submit-button'));

        expect(handleSendTransaction).toHaveBeenCalledTimes(1);
    });

    it('should disable the submit button until the send consent is requested', async () => {
        mockUseTradingOutputsReviewScreenControls.mockReturnValue(
            createControlsMockValue({ isTransactionAlreadySigned: true }),
        );
        const { getByTestId } = await renderReviewOutputsContent({
            accountKey: btc1NormalAccount.key,
            isTransactionSendConsentRequested: false,
        });

        expect(getByTestId('@trading/outputs-review/footer/submit-button')).toBeDisabled();
    });

    it('should disable the submit button when the transaction validity deadline has passed', async () => {
        mockUseTradingOutputsReviewScreenControls.mockReturnValue(
            createControlsMockValue({ isTransactionAlreadySigned: true, isPastDeadline: true }),
        );
        const { getByTestId } = await renderReviewOutputsContent({
            accountKey: btc1NormalAccount.key,
        });

        expect(getByTestId('@trading/outputs-review/footer/submit-button')).toBeDisabled();
    });

    it('should display the submit button loading state while broadcasting', async () => {
        mockUseTradingOutputsReviewScreenControls.mockReturnValue(
            createControlsMockValue({ isTransactionAlreadySigned: true, isBroadcasting: true }),
        );
        const { getByTestId } = await renderReviewOutputsContent({
            accountKey: btc1NormalAccount.key,
        });

        expect(
            getByTestId('@trading/outputs-review/footer/submit-button/loading'),
        ).toBeOnTheScreen();
    });

    it('should display the transaction validity timer', async () => {
        mockUseTradingOutputsReviewScreenControls.mockReturnValue(
            createControlsMockValue({
                isTransactionAlreadySigned: true,
                showTimer: true,
                secondsLeft: 30,
            }),
        );

        const { getByText } = await renderReviewOutputsContent();

        expect(
            getByText(
                getTranslation('transactionManagement.txValidityTimer.countdown', {
                    seconds: 30,
                }),
            ),
        ).toBeOnTheScreen();
    });

    it('renders loading skeleton when the review list display is still delayed', async () => {
        mockUseDelayedReviewOutputListDisplayFlag.mockReturnValue(false);

        const { getByTestId } = await renderReviewOutputsContent();

        expect(getByTestId('@trading/outputs-review/skeleton')).toBeOnTheScreen();
    });

    it('renders the no-account error when the account is unknown', async () => {
        const { getByText, queryByTestId } = await renderReviewOutputsContent();

        // The default accountKey is not present in the store, so the review
        // body falls back to the error state instead of the outputs list.
        expect(
            getByText(new RegExp(getTranslation('transactionManagement.review.outputs.noAccount'))),
        ).toBeOnTheScreen();
        expect(queryByTestId('@trading/outputs-review/skeleton')).not.toBeOnTheScreen();
    });

    it('renders SignDataMessageReview when exchangeFlowType is sign-data', async () => {
        const { getByText, queryByText } = await renderWithTradingProvider(
            <ReviewOutputsContent
                orderId="ORDER_ID"
                accountKey={mockAccountKey({ descriptor: 'accountKey' })}
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

        expect(
            getByText(getTranslation('moduleTrading.tradingReviewOutputs.signData.heading')),
        ).toBeOnTheScreen();
        // The message review replaces the outputs list entirely, so the
        // unknown-account error must not appear for the sign-data flow.
        expect(
            queryByText(getTranslation('transactionManagement.review.outputs.noAccount')),
        ).toBeNull();
    });
});
