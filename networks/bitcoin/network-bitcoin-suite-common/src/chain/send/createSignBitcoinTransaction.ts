import type { GetTrezorConnectDep, Params, SignTransaction } from '@trezor/connect-common';
import {
    ChainSendError,
    type ChainSignedTransaction,
    type GeneralPrecomposedTransactionFinal,
    type PrecomposedTransactionFinal,
    type SignChainTransactionParams,
    isRbfBumpFeeTransaction,
    toCoinSymbol,
} from '@trezor/network-module-suite-common-types';
import { BigNumber } from '@trezor/utils';

import { BITCOIN_ONLY_SYMBOLS } from './bitcoinSendConstants';
import { restoreOrigOutputsOrder } from './bitcoinSendHelpers';
import type { BitcoinSendAppDeps, BitcoinSendConfig } from './types';

export type SignBitcoinTransactionDeps = GetTrezorConnectDep<'signTransaction'> &
    Pick<BitcoinSendAppDeps, 'datetimeToLocktime' | 'getAccountTransactions'>;

export type SignBitcoinTransactionParams = SignChainTransactionParams & {
    config: BitcoinSendConfig;
};

export type SignBitcoinTransaction = (
    params: SignBitcoinTransactionParams,
) => Promise<ChainSignedTransaction>;

const isBitcoinPrecomposed = (
    tx: GeneralPrecomposedTransactionFinal,
): tx is PrecomposedTransactionFinal => !('unsignedTx' in tx);

const isBitcoinOnlySymbol = (symbol: string) =>
    BITCOIN_ONLY_SYMBOLS.some(bitcoinOnly => bitcoinOnly === symbol);

/**
 * Signs what coin selection built. A replacement (RBF) keeps the original transaction's inputs
 * first and its outputs in their order, as the device requires.
 */
export const createSignBitcoinTransaction =
    (deps: SignBitcoinTransactionDeps): SignBitcoinTransaction =>
    async ({ account, draft, precomposed, options, config }) => {
        const { symbol } = account;

        if (!isBitcoinPrecomposed(precomposed)) {
            throw new ChainSendError('sign-failed', symbol, 'Invalid input data.');
        }

        // transactionInfo needs some additional changes:
        const signEnhancement: Partial<SignTransaction> = {};

        if (draft.bitcoinLocktimeBlockHeight) {
            signEnhancement.locktime = new BigNumber(draft.bitcoinLocktimeBlockHeight).toNumber();
        } else if (draft.bitcoinLocktimeDatetime) {
            signEnhancement.locktime = deps.datetimeToLocktime(draft.bitcoinLocktimeDatetime);
        }

        if (draft.rbfParams?.type === 'bitcoin' && draft.rbfParams?.locktime) {
            signEnhancement.locktime = draft.rbfParams.locktime;
        }

        let refTxs;

        if (
            draft.rbfParams?.type === 'bitcoin' &&
            isRbfBumpFeeTransaction(precomposed) &&
            precomposed.useNativeRbf
        ) {
            const { txid, utxo, outputs } = draft.rbfParams;

            // normally taproot/coinjoin account doesn't require referenced transactions while signing
            // but in RBF case they are needed to obtain data of original transaction
            // passing them directly from tx history will prevent downloading them from the backend (in @trezor/connect)
            // this is essential step for coinjoin account to avoid leaking txid
            if (['coinjoin', 'taproot'].includes(account.accountType)) {
                refTxs = deps.getAccountTransactions(account).filter(tx => tx.txid === txid);
            }

            // override inputs and outputs of precomposed transaction
            // NOTE: RBF inputs/outputs required are to be in the same exact order as in original tx (covered by TrezorConnect.composeTransaction.sortStrategy='none param)
            // possible variations:
            // it's possible to add new utxo not related to the original tx at the end of the list
            // it's possible to add change-output if it not exists in original tx AND new utxo was added/used
            // it's possible to remove original change-output completely (give up all as a fee)
            // it's possible to decrease external output in favour of fee
            signEnhancement.inputs = precomposed.inputs.map((input, i) => {
                if (utxo[i]) {
                    return { ...input, orig_index: i, orig_hash: txid };
                }

                return input;
            });
            // NOTE: Rearranging of original outputs is not supported by the FW. Restoring original order.
            // edge-case: original tx have change-output on index 0 while new tx doesn't have change-output at all
            // or it's moved to the last position by @trezor/connect composeTransaction process.
            signEnhancement.outputs = restoreOrigOutputsOrder(precomposed.outputs, outputs, txid);
        }

        if (config.hasAccountFeature(account.accountType, 'amount-unit')) {
            signEnhancement.amountUnit = options.amountUnit;
        }

        if (account.unlockPath) {
            signEnhancement.unlockPath = account.unlockPath;
        }

        if (isBitcoinOnlySymbol(symbol)) {
            // nVersion, use 2 as it enables BIP68 + seems to be the most commonly used (= harder to fingerprint the Trezor)
            signEnhancement.version = 2;
        }

        const signPayload: Params<SignTransaction> = {
            device: options.device,
            inputs: precomposed.inputs,
            outputs: precomposed.outputs,
            account: {
                addresses: account.addresses!,
                transactions: refTxs,
            },
            coin: toCoinSymbol(symbol),
            chunkify: options.chunkify,
            ...signEnhancement,
            paymentRequests: options.paymentRequests,
        };

        const response = await deps.getTrezorConnect().signTransaction(signPayload);
        if (!response.success) {
            throw new ChainSendError(
                'sign-failed',
                symbol,
                response.error.message,
                response.error.code,
            );
        }

        return {
            serializedTx: response.payload.serializedTx,
            signedTransaction: response.payload.signedTransaction,
        };
    };
