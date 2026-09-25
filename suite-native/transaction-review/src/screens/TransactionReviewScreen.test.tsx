import { type ReactNode } from 'react';
import { View } from 'react-native';

import { type TransactionReviewStatefulOutput } from '@suite-common/wallet-types';
import { mockAccountKey } from '@suite-common/wallet-types/mocks';
import { Text as MockText } from '@suite-native/atoms';
import { getTranslation } from '@suite-native/intl';
import { renderWithStoreProvider } from '@suite-native/test-utils-store';

import {
    TransactionReviewScreen,
    type TransactionReviewTxValidityFlow,
} from './TransactionReviewScreen';
import { ETH_ACCOUNT_KEY, mockWalletState } from '../__fixtures__/walletState';

const mockUsePreventRemove = jest.fn();
const mockNavigation = {
    navigate: jest.fn(),
    goBack: jest.fn(),
    popToTop: jest.fn(),
    dispatch: jest.fn(),
    getState: () => ({ routes: [] }),
    addListener: jest.fn(() => jest.fn()),
};

jest.mock('@react-navigation/native', () => ({
    ...jest.requireActual('@react-navigation/native'),
    useNavigation: () => mockNavigation,
    usePreventRemove: (...args: unknown[]) => mockUsePreventRemove(...args),
}));

const mockInternalCloseSheet = jest.fn();

jest.mock('@suite-native/confirm-on-trezor', () => ({
    ...jest.requireActual('@suite-native/confirm-on-trezor'),
    useConfirmOnTrezorController: () => ({
        confirmOnTrezorRef: { current: null },
        closeSheet: mockInternalCloseSheet,
        revealConfirmOnTrezorSheet: jest.fn(),
    }),
    ConfirmOnTrezorWrapper: ({
        children,
        defaultHeader,
    }: {
        children: ReactNode;
        defaultHeader: ReactNode;
    }) => (
        <>
            {defaultHeader}
            {children}
        </>
    ),
}));

jest.mock('../components/TransactionReviewOutputItemValues', () => ({
    TransactionReviewOutputItemValues: ({
        translationKey,
        value,
    }: {
        translationKey: string;
        value: string;
    }) => (
        <MockText>
            Values: [{translationKey}]-[{value}]
        </MockText>
    ),
}));

const SCREEN_TEST_ID = 'review-screen';
const FOOTER_TEST_ID = 'review-footer';
const SEND_BUTTON_TEST_ID = 'review-send-button';

const reviewOutputs: TransactionReviewStatefulOutput[] = [
    { type: 'note', value: 'a review note', state: 'active' },
];

const txValidityFlow: TransactionReviewTxValidityFlow = {
    showTimer: true,
    secondsLeft: 30,
    isPastDeadline: false,
    isBroadcasting: false,
    onRetry: jest.fn(),
    isRetryDisabled: false,
};

type ScreenProps = Partial<React.ComponentProps<typeof TransactionReviewScreen>>;

describe('TransactionReviewScreen', () => {
    const renderScreen = async (props: ScreenProps = {}) =>
        await renderWithStoreProvider(
            <TransactionReviewScreen
                accountKey={ETH_ACCOUNT_KEY}
                reviewOutputs={reviewOutputs}
                isTransactionAlreadySigned={false}
                titleTranslationId="moduleSend.review.outputs.title"
                summaryTranslationId="transactionManagement.review.outputs.summary.label"
                sendButtonTranslationId="moduleSend.review.outputs.submitButton"
                testID={SCREEN_TEST_ID}
                footerTestId={FOOTER_TEST_ID}
                sendButtonTestId={SEND_BUTTON_TEST_ID}
                {...props}
            />,
            { preloadedState: { wallet: mockWalletState() } },
        );

    beforeEach(() => {
        jest.clearAllMocks();
    });

    it('should render the title and the outputs list', async () => {
        const { getByText, getByTestId } = await renderScreen();

        expect(getByTestId(SCREEN_TEST_ID)).toBeOnTheScreen();
        expect(getByText(getTranslation('moduleSend.review.outputs.title'))).toBeOnTheScreen();
        expect(getByText('a review note')).toBeOnTheScreen();
    });

    it('should not render the footer before the transaction is signed', async () => {
        const { queryByTestId } = await renderScreen();

        expect(queryByTestId(FOOTER_TEST_ID)).toBeNull();
    });

    it('should render the footer once the transaction is signed', async () => {
        const { getByTestId } = await renderScreen({ isTransactionAlreadySigned: true });

        expect(getByTestId(FOOTER_TEST_ID)).toBeOnTheScreen();
        expect(getByTestId(SEND_BUTTON_TEST_ID)).toHaveTextContent(
            getTranslation('moduleSend.review.outputs.submitButton'),
        );
    });

    it('should not render the footer for an unknown account even when signed', async () => {
        const { queryByTestId } = await renderScreen({
            isTransactionAlreadySigned: true,
            accountKey: mockAccountKey({ descriptor: 'unknown' }),
        });

        expect(queryByTestId(FOOTER_TEST_ID)).toBeNull();
    });

    it('should close the confirm-on-trezor sheet once the transaction is signed', async () => {
        const closeSheet = jest.fn();

        await renderScreen({
            isTransactionAlreadySigned: true,
            sheetController: {
                confirmOnTrezorRef: { current: null },
                closeSheet,
                revealConfirmOnTrezorSheet: jest.fn(),
            },
        });

        expect(closeSheet).toHaveBeenCalledTimes(1);
    });

    it('should use the internal sheet controller when none is provided', async () => {
        await renderScreen({ isTransactionAlreadySigned: true });

        expect(mockInternalCloseSheet).toHaveBeenCalledTimes(1);
    });

    it('should render the validity timer when the flow requests it', async () => {
        const { getByText } = await renderScreen({ txValidityFlow });

        expect(
            getByText(
                getTranslation('transactionManagement.txValidityTimer.countdown', { seconds: 30 }),
            ),
        ).toBeOnTheScreen();
    });

    it('should not render the validity timer when the flow hides it', async () => {
        const { queryByText } = await renderScreen({
            txValidityFlow: { ...txValidityFlow, showTimer: false },
        });

        expect(
            queryByText(
                getTranslation('transactionManagement.txValidityTimer.countdown', { seconds: 30 }),
            ),
        ).toBeNull();
    });

    it('should disable the send button once the validity deadline has passed', async () => {
        const { getByTestId } = await renderScreen({
            isTransactionAlreadySigned: true,
            txValidityFlow: { ...txValidityFlow, isPastDeadline: true },
        });

        expect(getByTestId(SEND_BUTTON_TEST_ID)).toBeDisabled();
    });

    it('should disable the send button when the review disables it', async () => {
        const { getByTestId } = await renderScreen({
            isTransactionAlreadySigned: true,
            isSendButtonDisabled: true,
        });

        expect(getByTestId(SEND_BUTTON_TEST_ID)).toBeDisabled();
    });

    it('should render the custom outputs list instead of the default one', async () => {
        const { getByTestId, queryByText } = await renderScreen({
            renderOutputsList: () => <View testID="custom-list" />,
        });

        expect(getByTestId('custom-list')).toBeOnTheScreen();
        expect(queryByText('a review note')).toBeNull();
    });

    it('should render children inside the screen', async () => {
        const { getByTestId } = await renderScreen({
            children: <View testID="screen-children" />,
        });

        expect(getByTestId('screen-children')).toBeOnTheScreen();
    });

    it('should enable the back interceptor by default', async () => {
        await renderScreen();

        expect(mockUsePreventRemove).toHaveBeenCalledWith(true, expect.any(Function));
    });

    it('should disable the back interceptor when requested', async () => {
        await renderScreen({ isBackInterceptorEnabled: false });

        expect(mockUsePreventRemove).toHaveBeenCalledWith(false, expect.any(Function));
    });
});
