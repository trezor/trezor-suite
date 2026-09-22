import { createThunk } from '@suite-common/redux-utils';
import type {
    Account,
    ChainedTransactions,
    WalletAccountTransaction,
} from '@suite-common/wallet-types';
import { getMyInputsFromTransaction } from '@suite-common/wallet-utils';
import TrezorConnect, {
    DEFAULT_SORTING_STRATEGY,
    type PrecomposeResultFinal,
} from '@trezor/connect';
import { asCoinSymbol } from '@trezor/connect-common';

import { SEND_MODULE_PREFIX } from '../sendFormConstants';
import { calculateNewFee } from './calculateNewFee';

export type ComposeCancelTransactionAccount = Required<
    Pick<Account, 'addresses' | 'path' | 'symbol'>
>;

export const isComposeCancelTransactionAccount = (
    account: Account,
): account is Account & ComposeCancelTransactionAccount => !!account.addresses;

const resolveCancelAddress = (
    tx: Pick<WalletAccountTransaction, 'details'>,
    account: ComposeCancelTransactionAccount,
): string => {
    const firstChangeAddress = tx.details.vout.find(vout => vout.isAccountOwned)?.addresses?.[0];
    if (firstChangeAddress) {
        return firstChangeAddress;
    }

    const firstUnused = account.addresses.unused[0];
    if (firstUnused) {
        return firstUnused.address;
    }

    throw new Error('No unused addresses, should not happen!');
};

export type ComposeCancelTransactionThunkParams = {
    tx: Pick<WalletAccountTransaction, 'details' | 'vsize' | 'fee'>;
    account: ComposeCancelTransactionAccount;
    chainedTxs?: ChainedTransactions;
};

export const composeCancelTransactionThunk = createThunk<
    PrecomposeResultFinal,
    ComposeCancelTransactionThunkParams,
    { rejectValue: string }
>(
    `${SEND_MODULE_PREFIX}/composeCancelTransactionThunk`,
    async ({ tx, account, chainedTxs }, { rejectWithValue }) => {
        if (tx.vsize === undefined) {
            return rejectWithValue('Transaction vsize is not loaded');
        }

        const utxo = getMyInputsFromTransaction({ tx, account });
        const cancelAddress = resolveCancelAddress(tx, account);

        const composeParams: Parameters<(typeof TrezorConnect)['composeTransaction']>[0] = {
            account: {
                path: account.path,
                addresses: account.addresses,
                utxo,
            },
            feeLevels: [{ feePerUnit: '1' }], // We don't care about the fee, we just need to compose transaction to get its size
            outputs: [{ type: 'send-max', address: cancelAddress }],
            sortingStrategy: DEFAULT_SORTING_STRATEGY,
            coin: asCoinSymbol(account.symbol),
        };

        const response = await TrezorConnect.composeTransaction(composeParams);

        if (!response.success) {
            return rejectWithValue(`Unexpected compose error: ${response.error.message}`);
        }

        const tempCancelTx = response.payload[0];

        if (tempCancelTx?.type !== 'final') {
            return rejectWithValue('Unexpected compose tempCancelTxResult (non-final)');
        }

        const newTransactionSize = tempCancelTx.bytes;

        const { newFeeRate, chainedTransactionFees } = calculateNewFee({
            originalFee: tx.fee,
            newTransactionSize,
            chainedTxs,
        });

        const sizeCalculationResponse = await TrezorConnect.composeTransaction({
            ...composeParams,
            feeLevels: [{ feePerUnit: newFeeRate.toString() }],
            baseFee: chainedTransactionFees, // BIP-125 rule 3 (paying for chained transactions)
        });

        if (!sizeCalculationResponse.success) {
            return rejectWithValue('Unexpected compose result (error)');
        }

        const composedTx = sizeCalculationResponse.payload[0];

        if (composedTx?.type !== 'final') {
            return rejectWithValue('Unexpected compose result (non-final)');
        }

        return composedTx;
    },
);
