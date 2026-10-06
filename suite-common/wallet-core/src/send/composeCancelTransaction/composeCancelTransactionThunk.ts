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
): string | undefined => {
    const firstChangeAddress = tx.details.vout.find(vout => vout.isAccountOwned)?.addresses?.[0];
    if (firstChangeAddress) {
        return firstChangeAddress;
    }

    const firstUnused = addresses.change.find(a => !a.transfers) ?? addresses.change.at(-1);
    if (firstUnused) {
        return firstUnused.address;
    }
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
        const cancelAddress = resolveCancelAddress(tx, account);
        const baseFee = calculateBaseFee(tx, chainedTxs);
        const feePerUnit = getRelayFee().toString();
        const coin = asCoinSymbol(account.symbol);

        if (!cancelAddress) {
            return rejectWithValue('No change addresses, should not happen!');
        }

        const response = await TrezorConnect.composeTransaction({
            account: {
                path: account.path,
                addresses: account.addresses,
                utxo,
            },
            outputs: [{ type: 'send-max', address: cancelAddress }],
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
