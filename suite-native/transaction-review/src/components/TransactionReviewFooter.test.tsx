import { type WalletAccountTransaction } from '@suite-common/wallet-types';
import { getTranslation } from '@suite-native/intl';
import { userEvent, waitFor } from '@suite-native/test-utils-store';

import { TransactionReviewFooter } from './TransactionReviewFooter';
import {
    type TransactionReviewTestProviderProps,
    renderWithTransactionReview,
} from '../__fixtures__/renderWithTransactionReview';
import { ETH_ACCOUNT_KEY, mockEthAccount, mockWalletState } from '../__fixtures__/walletState';

const SEND_BUTTON_TEST_ID = 'send-button';
const FOOTER_TEST_ID = 'footer';
const TXID = 'sent-txid';

// The transactions slice only needs the txid lookup to succeed here; the
// remaining fields are irrelevant to the footer.
const mockTransaction = (txid: string) =>
    ({
        descriptor: mockEthAccount().descriptor,
        deviceState: mockEthAccount().deviceState,
        symbol: 'eth',
        type: 'sent',
        txid,
        amount: '0',
        fee: '0',
        targets: [],
        tokens: [],
        internalTransfers: [],
        details: { vin: [], vout: [], size: 0, totalInput: '0', totalOutput: '0' },
    }) as unknown as WalletAccountTransaction;

const mockWalletStateWithTransaction = (txid: string) => {
    const wallet = mockWalletState();

    return {
        ...wallet,
        transactions: {
            ...wallet.transactions,
            transactions: { [ETH_ACCOUNT_KEY]: [mockTransaction(txid)] },
        },
    };
};

describe('TransactionReviewFooter', () => {
    const renderFooter = async (
        providerProps: TransactionReviewTestProviderProps = {},
        {
            isSendButtonDisabled,
            preloadedState,
        }: { isSendButtonDisabled?: boolean; preloadedState?: object } = {},
    ) =>
        await renderWithTransactionReview(
            <TransactionReviewFooter isSendButtonDisabled={isSendButtonDisabled} />,
            {
                providerProps: {
                    isTransactionAlreadySigned: true,
                    sendButtonTestId: SEND_BUTTON_TEST_ID,
                    footerTestId: FOOTER_TEST_ID,
                    ...providerProps,
                },
                preloadedState,
            },
        );

    beforeEach(() => {
        jest.clearAllMocks();
    });

    it('should render the send button with the review translation and test ids', async () => {
        const { getByTestId } = await renderFooter();

        expect(getByTestId(FOOTER_TEST_ID)).toBeOnTheScreen();
        expect(getByTestId(SEND_BUTTON_TEST_ID)).toHaveTextContent(
            getTranslation('moduleSend.review.outputs.submitButton'),
        );
        expect(getByTestId(SEND_BUTTON_TEST_ID)).toBeEnabled();
    });

    it('should send the transaction and report the txid on success', async () => {
        const onSendTransaction = jest.fn(() => Promise.resolve(TXID));
        const onSendTransactionSuccess = jest.fn();

        const { getByTestId } = await renderFooter({ onSendTransaction, onSendTransactionSuccess });

        await userEvent.press(getByTestId(SEND_BUTTON_TEST_ID));

        expect(onSendTransaction).toHaveBeenCalledTimes(1);
        await waitFor(() => expect(onSendTransactionSuccess).toHaveBeenCalledWith(TXID));
        // The button stays in the loading state until the flow navigates away.
        expect(getByTestId(`${SEND_BUTTON_TEST_ID}/loading`)).toBeOnTheScreen();
    });

    it('should stop loading and not report success when sending fails', async () => {
        const onSendTransaction = jest.fn(() => Promise.resolve(undefined));
        const onSendTransactionSuccess = jest.fn();

        const { getByTestId, queryByTestId } = await renderFooter({
            onSendTransaction,
            onSendTransactionSuccess,
        });

        await userEvent.press(getByTestId(SEND_BUTTON_TEST_ID));

        expect(onSendTransaction).toHaveBeenCalledTimes(1);
        await waitFor(() => expect(queryByTestId(`${SEND_BUTTON_TEST_ID}/loading`)).toBeNull());
        expect(onSendTransactionSuccess).not.toHaveBeenCalled();
    });

    it('should not send when the button is disabled', async () => {
        const onSendTransaction = jest.fn(() => Promise.resolve(TXID));

        const { getByTestId } = await renderFooter(
            { onSendTransaction },
            { isSendButtonDisabled: true },
        );

        expect(getByTestId(SEND_BUTTON_TEST_ID)).toBeDisabled();

        await userEvent.press(getByTestId(SEND_BUTTON_TEST_ID));

        expect(onSendTransaction).not.toHaveBeenCalled();
    });

    it('should fall back to the review disabled flag when no prop is given', async () => {
        const { getByTestId } = await renderFooter({ isSendButtonDisabled: true });

        expect(getByTestId(SEND_BUTTON_TEST_ID)).toBeDisabled();
    });

    it('should show the external loading state when provided', async () => {
        const { getByTestId } = await renderFooter({ isSendButtonLoading: true });

        expect(getByTestId(`${SEND_BUTTON_TEST_ID}/loading`)).toBeOnTheScreen();
    });

    it('should report the confirmed transaction once it appears in the store', async () => {
        const onSendTransaction = jest.fn(() => Promise.resolve(TXID));
        const onSendTransactionConfirmed = jest.fn();

        const { getByTestId } = await renderFooter(
            { onSendTransaction, onSendTransactionConfirmed },
            { preloadedState: { wallet: mockWalletStateWithTransaction(TXID) } },
        );

        expect(onSendTransactionConfirmed).not.toHaveBeenCalled();

        await userEvent.press(getByTestId(SEND_BUTTON_TEST_ID));

        await waitFor(() => expect(onSendTransactionConfirmed).toHaveBeenCalledWith(TXID));
        expect(onSendTransactionConfirmed).toHaveBeenCalledTimes(1);
    });

    it('should not report a confirmed transaction that is not in the store', async () => {
        const onSendTransaction = jest.fn(() => Promise.resolve(TXID));
        const onSendTransactionConfirmed = jest.fn();

        const { getByTestId } = await renderFooter(
            { onSendTransaction, onSendTransactionConfirmed },
            { preloadedState: { wallet: mockWalletStateWithTransaction('another-txid') } },
        );

        await userEvent.press(getByTestId(SEND_BUTTON_TEST_ID));

        await waitFor(() => expect(onSendTransaction).toHaveBeenCalledTimes(1));
        expect(onSendTransactionConfirmed).not.toHaveBeenCalled();
    });
});
