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
import { calculateBaseFee, getRelayFee } from './calculateNewFee';

export type ComposeCancelTransactionAccount = Required<
    Pick<Account, 'addresses' | 'path' | 'symbol'>
>;

export const isComposeCancelTransactionAccount = (
    account: Account,
): account is Account & ComposeCancelTransactionAccount => !!account.addresses;

const resolveCancelAddress = (
    tx: Pick<WalletAccountTransaction, 'details'>,
    { addresses }: ComposeCancelTransactionAccount,
) => {
    const usedOwnedAddresses = tx.details.vout
        .filter(vout => vout.isAccountOwned)
        .flatMap(vout => vout.addresses ?? []);

    return (
        // take first change address used as an output in original transaction
        addresses.change.find(a => usedOwnedAddresses.includes(a.address)) ??
        // or the first unused change address
        addresses.change.find(a => !a.transfers) ??
        // or fall back to the last known change address
        addresses.change.at(-1)
    );
};

export type ComposeCancelTransactionThunkParams = {
    tx: Pick<WalletAccountTransaction, 'details' | 'fee'>;
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
        const utxo = getMyInputsFromTransaction({ tx, account });
        const changeAddress = resolveCancelAddress(tx, account);
        const baseFee = calculateBaseFee(tx, chainedTxs);
        const feePerUnit = getRelayFee().toString();
        const coin = asCoinSymbol(account.symbol);

        if (!changeAddress) {
            return rejectWithValue('No change addresses, should not happen!');
        }

        const response = await TrezorConnect.composeTransaction({
            path: account.path,
            utxo,
            changeAddress,
            outputs: [{ type: 'send-max', address: changeAddress.address }],
            sortingStrategy: DEFAULT_SORTING_STRATEGY,
            coin,
            feeLevels: [{ feePerUnit }],
            baseFee,
        });

        if (!response.success) {
            return rejectWithValue(`Unexpected compose error: ${response.error.message}`);
        }

        const composedTx = response.payload[0];

        if (composedTx?.type !== 'final') {
            return rejectWithValue('Unexpected compose result (non-final)');
        }

        return composedTx;
    },
);
