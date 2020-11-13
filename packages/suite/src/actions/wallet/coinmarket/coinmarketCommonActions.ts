import TrezorConnect, { UI, ButtonRequestMessage } from 'trezor-connect';
import * as coinmarketCommonActions from '@wallet-actions/coinmarket/coinmarketCommonActions';
import { formatNetworkAmount, formatAmount } from '@wallet-utils/accountUtils';
import BigNumber from 'bignumber.js';
import {
    ComposeTransactionData,
    ReviewTransactionData,
    SignTransactionData,
    SignedTx,
} from '@wallet-types/transaction';
import { GetState, Dispatch } from '@suite-types';
import * as accountActions from '@wallet-actions/accountActions';
import * as notificationActions from '@suite-actions/notificationActions';
import * as transactionBitcoinActions from './coinmarketTransactionBitcoinActions';
import * as transactionEthereumActions from './coinmarketTransactionEthereumActions';
import * as transactionRippleActions from './coinmarketTransactionRippleActions';
import * as modalActions from '@suite-actions/modalActions';
import { PrecomposedTransactionFinal } from '@wallet-types/sendForm';
import { COINMARKET_BUY, COINMARKET_EXCHANGE, COINMARKET_COMMON } from '../constants';
import { getUnusedAddressFromAccount } from '@wallet-utils/coinmarket/coinmarketUtils';
import { Account } from '@wallet-types';

export type CoinmarketCommonAction =
    | { type: typeof COINMARKET_COMMON.SAVE_TRANSACTION_REVIEW; reviewData: ReviewTransactionData }
    | {
          type: typeof COINMARKET_COMMON.SAVE_COMPOSED_TRANSACTION;
          composedTransaction: PrecomposedTransactionFinal;
      };

export const verifyAddress = (account: Account, inExchange = false) => async (
    dispatch: Dispatch,
    getState: GetState,
) => {
    const { device } = getState().suite;
    if (!device || !account) return;
    const { path, address } = getUnusedAddressFromAccount(account);
    if (!path || !address) return;

    const { networkType, symbol } = account;
    const { useEmptyPassphrase, connected, available } = device;

    const modalPayload = {
        device,
        address,
        networkType,
        symbol,
        addressPath: path,
    };

    // Show warning when device is not connected
    if (!connected || !available) {
        dispatch(
            modalActions.openModal({
                type: 'unverified-address',
                ...modalPayload,
            }),
        );
        return;
    }

    const params = {
        device,
        path,
        useEmptyPassphrase,
        coin: account.symbol,
    };

    // catch button request and open modal
    const buttonRequestHandler = (event: ButtonRequestMessage['payload']) => {
        if (!event || event.code !== 'ButtonRequest_Address') return;
        dispatch(
            modalActions.openModal({
                type: 'address',
                ...modalPayload,
            }),
        );
    };

    let fn;
    switch (networkType) {
        case 'ethereum':
            fn = TrezorConnect.ethereumGetAddress;
            break;
        case 'ripple':
            fn = TrezorConnect.rippleGetAddress;
            break;
        case 'bitcoin':
            fn = TrezorConnect.getAddress;
            break;
        default:
            fn = () => ({
                success: false,
                payload: { error: 'Method for getAddress not defined', code: undefined },
            });
            break;
    }

    TrezorConnect.on(UI.REQUEST_BUTTON, buttonRequestHandler);
    const response = await fn(params);
    TrezorConnect.off(UI.REQUEST_BUTTON, buttonRequestHandler);

    if (response.success) {
        dispatch({
            type: inExchange ? COINMARKET_EXCHANGE.VERIFY_ADDRESS : COINMARKET_BUY.VERIFY_ADDRESS,
            addressVerified: address,
        });
    } else {
        // special case: device no-backup permissions not granted
        if (response.payload.code === 'Method_PermissionsNotGranted') return;

        dispatch(
            notificationActions.addToast({
                type: 'verify-address-error',
                error: response.payload.error,
            }),
        );
    }
};

export const saveComposedTransaction = (
    composedTransaction: PrecomposedTransactionFinal,
): CoinmarketCommonAction => ({
    type: COINMARKET_COMMON.SAVE_COMPOSED_TRANSACTION,
    composedTransaction,
});

export const saveTransactionReview = (
    reviewData: ReviewTransactionData,
): CoinmarketCommonAction => ({
    type: COINMARKET_COMMON.SAVE_TRANSACTION_REVIEW,
    reviewData,
});

export const composeTransaction = (composeTransactionData: ComposeTransactionData) => (
    dispatch: Dispatch,
) => {
    const {
        account: { networkType },
    } = composeTransactionData;

    if (networkType === 'bitcoin') {
        return dispatch(transactionBitcoinActions.composeTransaction(composeTransactionData));
    }

    if (networkType === 'ethereum') {
        return dispatch(transactionEthereumActions.composeTransaction(composeTransactionData));
    }

    if (networkType === 'ripple') {
        return dispatch(transactionRippleActions.composeTransaction(composeTransactionData));
    }
};

export const signTransaction = (signTransactionData: SignTransactionData) => async (
    dispatch: Dispatch,
) => {
    const { account } = signTransactionData;

    if (!account) return;

    let reviewData: ReviewTransactionData | undefined;

    if (account.networkType === 'bitcoin') {
        reviewData = await dispatch(transactionBitcoinActions.signTransaction(signTransactionData));
    }

    if (account.networkType === 'ethereum') {
        reviewData = await dispatch(
            transactionEthereumActions.signTransaction(signTransactionData),
        );
    }

    if (account.networkType === 'ripple') {
        reviewData = await dispatch(transactionRippleActions.signTransaction(signTransactionData));
    }

    if (!reviewData?.signedTx?.tx) return;

    await dispatch(coinmarketCommonActions.saveTransactionReview(reviewData));

    const decision = await dispatch(
        modalActions.openDeferredModal({ type: 'coinmarket-review-transaction' }),
    );

    if (decision && reviewData.transactionInfo) {
        return dispatch(coinmarketCommonActions.pushTransaction(reviewData));
    }
};

export const cancelSignTx = (signedTx: SignedTx) => (dispatch: Dispatch) => {
    if (!signedTx) {
        TrezorConnect.cancel('tx-cancelled');
        return;
    }
    // otherwise just close modal
    dispatch(modalActions.onCancel());
};

export const pushTransaction = (reviewData: ReviewTransactionData) => async (
    dispatch: Dispatch,
    getState: GetState,
) => {
    const { account } = getState().wallet.selectedAccount;
    const { device } = getState().suite;
    const { signedTx, transactionInfo } = reviewData;

    if (!signedTx || !transactionInfo || !account) return false;

    const sentTx = await TrezorConnect.pushTransaction(signedTx);

    // close modal regardless result
    dispatch(cancelSignTx(signedTx));

    const { token } = transactionInfo;
    const spentWithoutFee = !token
        ? new BigNumber(transactionInfo.totalSpent).minus(transactionInfo.fee).toString()
        : '0';
    // get total amount without fee OR token amount
    const formattedAmount = token
        ? `${formatAmount(
              transactionInfo.totalSpent,
              token.decimals,
          )} ${token.symbol!.toUpperCase()}`
        : formatNetworkAmount(spentWithoutFee, account.symbol, true);

    if (sentTx.success) {
        dispatch(
            notificationActions.addToast({
                type: 'tx-sent',
                formattedAmount,
                device,
                descriptor: account.descriptor,
                symbol: account.symbol,
                txid: sentTx.payload.txid,
            }),
        );

        dispatch(accountActions.fetchAndUpdateAccount(account));
    } else {
        dispatch(
            notificationActions.addToast({ type: 'sign-tx-error', error: sentTx.payload.error }),
        );
    }

    return sentTx.success;
};
