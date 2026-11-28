import type { MessagesSchema as PROTO } from '@trezor/protobuf';
import { type Result, err, ok } from '@trezor/type-utils';
import { Transaction } from '@trezor/utxo-lib';

import { ACCOUNT_TYPE_DEFINITIONS, type AccountType } from './accountType';
import { BITCOIN_NETWORK } from './bitcoinNetwork';
import { deriveAccountScript, parseAccountXpub } from './deriveAccountScript';
import { getOutpointKey } from './outpoint';

export type PreviousTransactionErrorType =
    | 'invalid-account-xpub'
    | 'duplicate-input'
    | 'unexpected-input-path'
    | 'unexpected-script-type'
    | 'missing-transaction'
    | 'unparsable-transaction'
    | 'hash-mismatch'
    | 'missing-output'
    | 'script-mismatch'
    | 'amount-mismatch';

export type PreviousTransactionError = {
    type: PreviousTransactionErrorType;
    /** Position of the offending input in the transaction, when the error concerns one. */
    inputIndex?: number;
};

export type VerifyPreviousTransactionsParams = {
    inputs: readonly PROTO.TxInputType[];
    /** Raw previous transactions as delivered by the backend, keyed by the requested txid. */
    previousTransactionHexes: ReadonlyMap<string, string>;
    accountType: AccountType;
    /** Path of the account all inputs must belong to: purpose, coin and account. */
    accountPath: readonly number[];
    /** Account public key (with the `xpub` prefix) built on the host during discovery. */
    accountXpub: string;
};

const ACCOUNT_PATH_LENGTH = 3;
const ADDRESS_PATH_LENGTH = 5;

const parseTransaction = (hex: string) => {
    try {
        return Transaction.fromHex(hex, { network: BITCOIN_NETWORK });
    } catch {
        return undefined;
    }
};

const isSameAmount = (left: string | number, right: string) => {
    try {
        return BigInt(left) === BigInt(right);
    } catch {
        return false;
    }
};

/**
 * Proves, for every input and without trusting the backend, that the previous transaction really
 * creates the output the input claims to spend.
 *
 * Firmware 1.5.1-1.6.3 takes the amount of a SegWit input from the host and never sees the
 * previous transaction, and it is the host that declares an input to be SegWit. The fee shown on
 * the device is therefore only true if these three facts hold for each input:
 *
 * - the supplied previous transaction hashes to the `prev_hash` of the input;
 * - its output at `prev_index` carries exactly the script the account derives for `address_n`
 *   under the declared `script_type`, so a legacy output cannot be presented as SegWit;
 * - that output is worth exactly the declared `amount`.
 */
export const verifyPreviousTransactions = ({
    inputs,
    previousTransactionHexes,
    accountType,
    accountPath,
    accountXpub,
}: VerifyPreviousTransactionsParams): Result<Transaction[], PreviousTransactionError> => {
    const accountNode = parseAccountXpub(accountXpub);
    if (!accountNode.success || accountPath.length !== ACCOUNT_PATH_LENGTH) {
        return err({ type: 'invalid-account-xpub' });
    }

    const expectedScriptType = ACCOUNT_TYPE_DEFINITIONS[accountType].inputScriptType;
    const seenOutpoints = new Set<string>();
    const verifiedTransactions = new Map<string, Transaction>();

    for (const [inputIndex, input] of inputs.entries()) {
        const fail = (type: PreviousTransactionErrorType) => err({ type, inputIndex });

        const outpointKey = getOutpointKey({ txid: input.prev_hash, vout: input.prev_index });
        if (seenOutpoints.has(outpointKey)) return fail('duplicate-input');
        seenOutpoints.add(outpointKey);

        const { address_n: path } = input;
        const isPathInAccount =
            Array.isArray(path) &&
            path.length === ADDRESS_PATH_LENGTH &&
            accountPath.every((part, position) => path[position] === part);
        if (!isPathInAccount) return fail('unexpected-input-path');

        if (input.script_type !== expectedScriptType) return fail('unexpected-script-type');

        const txid = input.prev_hash.toLowerCase();
        const hex = previousTransactionHexes.get(txid);
        if (hex === undefined) return fail('missing-transaction');

        const transaction = verifiedTransactions.get(txid) ?? parseTransaction(hex);
        if (!transaction) return fail('unparsable-transaction');

        if (transaction.getId() !== txid) return fail('hash-mismatch');

        const output = transaction.outs[input.prev_index];
        if (!output) return fail('missing-output');

        const [chain, addressIndex] = path.slice(ACCOUNT_PATH_LENGTH);
        const expectedScript =
            chain === undefined || addressIndex === undefined
                ? undefined
                : deriveAccountScript({
                      accountNode: accountNode.payload,
                      accountType,
                      chain,
                      addressIndex,
                  });
        if (!expectedScript?.success) return fail('unexpected-input-path');

        if (!expectedScript.payload.equals(output.script)) return fail('script-mismatch');

        if (!isSameAmount(input.amount, output.value)) return fail('amount-mismatch');

        verifiedTransactions.set(txid, transaction);
    }

    return ok([...verifiedTransactions.values()]);
};
