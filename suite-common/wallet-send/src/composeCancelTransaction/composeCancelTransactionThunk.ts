import { isRejected } from '@reduxjs/toolkit';

import { createThunk } from '@suite-common/redux-utils';
import { ChainedTransactions, WalletAccountTransaction } from '@suite-common/wallet-types';
import { getMyInputsFromTransaction } from '@suite-common/wallet-utils';
import TrezorConnect, { DEFAULT_SORTING_STRATEGY, PrecomposeResultFinal } from '@trezor/connect';

import { SEND_MODULE_PREFIX } from '../sendFormConstants';
import { calculateNewFee } from './calculateNewFee';
import {
    ComposeCancelTransactionPartialAccount,
    ConnectComposeTxCallParams,
} from './cancelTransactionTypes';
import { resolveCancelAddress } from './resolveCancelAddress';

type ConnectComposeParams = {
    account: ComposeCancelTransactionPartialAccount;
    tx: Pick<WalletAccountTransaction, 'details'>;
    newFeeRate: string;
    baseFee?: number;
};

const composeCancelTransaction = async ({
    account,
    tx,
    newFeeRate,
    baseFee,
}: ConnectComposeParams) => {
    // override Account data, similar to RBF
    const cancelAccount: ConnectComposeTxCallParams['account'] = {
        ...account,
        utxo: getMyInputsFromTransaction({ tx, account }),

        // make sure that the exact same change output will be picked by @trezor/connect > hd-wallet during the tx compose process
        addresses: account.addresses,
    };

    const cancelAddress = resolveCancelAddress({ account, tx });

    const params: ConnectComposeTxCallParams = {
        feeLevels: [{ feePerUnit: newFeeRate }],
        account: cancelAccount,
        outputs: [
            {
                type: 'send-max',
                address: cancelAddress,
            },
        ],
        sortingStrategy: DEFAULT_SORTING_STRATEGY,
        coin: account.symbol,
        baseFee,
    };

    return await TrezorConnect.composeTransaction(params);
};

type CalculateNewTransactionSizeParams = {
    tx: Pick<WalletAccountTransaction, 'details'>;
    account: ComposeCancelTransactionPartialAccount;
};

const calculateNewTransactionSize = createThunk<
    number,
    CalculateNewTransactionSizeParams,
    { rejectValue: string }
>(
    `${SEND_MODULE_PREFIX}/calculateNewTransactionSize`,
    async ({ account, tx }, { rejectWithValue }) => {
        const tempCancelTxResult = await composeCancelTransaction({
            account,
            tx,
            newFeeRate: '1', // We don't care about the fee, we just need to compose transaction to get its size
        });

        if (!tempCancelTxResult.success) {
            return rejectWithValue(`Unexpected compose error: ${tempCancelTxResult.payload.error}`);
        }

        const tempCancelTx = tempCancelTxResult.payload[0];

        if (tempCancelTx.type !== 'final') {
            return rejectWithValue('Unexpected compose tempCancelTxResult (non-final)');
        }

        return tempCancelTx.bytes;
    },
);

export type ComposeCancelTransactionThunkParams = {
    tx: Pick<WalletAccountTransaction, 'details' | 'vsize' | 'fee'>;
    account: ComposeCancelTransactionPartialAccount;
    chainedTxs?: ChainedTransactions;
};

export const composeCancelTransactionThunk = createThunk<
    PrecomposeResultFinal,
    ComposeCancelTransactionThunkParams,
    { rejectValue: string }
>(
    `${SEND_MODULE_PREFIX}/composeCancelTransactionThunk`,
    async ({ tx, account, chainedTxs }, { rejectWithValue, dispatch }) => {
        if (tx.vsize === undefined) {
            return rejectWithValue('Transaction vsize is not loaded');
        }

        const response = await dispatch(calculateNewTransactionSize({ account, tx }));

        if (isRejected(response)) {
            return rejectWithValue(response.error.message ?? 'unknown');
        }

        const newTransactionSize = response.payload;

        const { newFeeRate, chainedTransactionFees } = calculateNewFee({
            originalFee: tx.fee,
            newTransactionSize,
            chainedTxs,
        });

        const sizeCalculationResponse = await composeCancelTransaction({
            account,
            tx,
            newFeeRate: newFeeRate.toString(),
            baseFee: chainedTransactionFees, // BIP-125 rule 3 (paying for chained transactions)
        });

        if (!sizeCalculationResponse.success) {
            return rejectWithValue('Unexpected compose result (error)');
        }

        const composedTx = sizeCalculationResponse.payload[0];

        if (composedTx.type !== 'final') {
            return rejectWithValue('Unexpected compose result (non-final)');
        }

        return composedTx;
    },
);
