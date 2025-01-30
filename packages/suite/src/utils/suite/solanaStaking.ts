import {
    CompilableTransactionMessage,
    SignatureBytes,
    Transaction,
    TransactionMessageWithBlockhashLifetime,
    compileTransaction,
    getBase16Codec,
    getTransactionEncoder,
    pipe,
} from '@solana/web3.js';

import { NetworkSymbol } from '@suite-common/wallet-config';
import { WALLET_SDK_SOURCE } from '@suite-common/wallet-constants';
import { Blockchain } from '@suite-common/wallet-types';
import {
    networkAmountToSmallestUnit,
    selectSolanaWalletSdkNetwork,
} from '@suite-common/wallet-utils';
import type { SolanaSignTransaction } from '@trezor/connect';

type SolanaTx = SolanaSignTransaction & {
    txShim: TransactionShim;
};

type TransactionShim = {
    addSignature(signerPubKey: string, signatureHex: string): void;
    serializeMessage(): string;
    serialize(): string;
};

// This function is used in the solanaUtils in the connect package
// It is used to create a transaction shim
// Since it's not possible to export separate function form the connect package we need to copy it here
// TODO: Refactor this function to avoid code duplication
function createTransactionShimCommon(transaction: Transaction) {
    return {
        addSignature(signerPubKey: string, signatureHex: string) {
            if (signerPubKey in transaction.signatures) {
                const signatureBytes = getBase16Codec().encode(signatureHex) as SignatureBytes;
                transaction = Object.freeze({
                    ...transaction,
                    signatures: Object.freeze({
                        ...transaction.signatures,
                        [signerPubKey]: signatureBytes,
                    }),
                });
            }
        },
        serializeMessage() {
            return getBase16Codec().decode(transaction.messageBytes);
        },
        serialize() {
            return pipe(transaction, getTransactionEncoder().encode, getBase16Codec().decode);
        },
    };
}

export const transformTx = (
    tx: CompilableTransactionMessage & TransactionMessageWithBlockhashLifetime,
    path: string | number[],
    tokenAccountsInfos?: {
        baseAddress: string;
        tokenProgram: string;
        tokenMint: string;
        tokenAccount: string;
    }[],
): SolanaTx => {
    const compilableTx = compileTransaction(tx);
    const txShim = createTransactionShimCommon(compilableTx);
    const transformedTx = {
        path,
        serializedTx: txShim.serializeMessage(),
        additionalInfo: tokenAccountsInfos ? { tokenAccountsInfos } : undefined,
        txShim,
    };

    return transformedTx;
};

interface PrepareStakeSolTxParams {
    from: string;
    path: string | number[];
    amount: string;
    symbol: NetworkSymbol;
    selectedBlockchain: Blockchain;
}
export type PrepareStakeSolTxResponse =
    | {
          success: true;
          tx: SolanaTx;
      }
    | {
          success: false;
          errorMessage: string;
      };
// Type guard to check if transaction is of type CompilableTransactionMessage
function isCompilableTransactionMessage(
    tx: TransactionMessageWithBlockhashLifetime | CompilableTransactionMessage,
): tx is CompilableTransactionMessage {
    return (tx as CompilableTransactionMessage).feePayer !== undefined;
}

export const prepareStakeSolTx = async ({
    from,
    path,
    amount,
    symbol,
    selectedBlockchain,
}: PrepareStakeSolTxParams): Promise<PrepareStakeSolTxResponse> => {
    try {
        const solanaClient = selectSolanaWalletSdkNetwork(symbol, selectedBlockchain.url);

        const lamports = networkAmountToSmallestUnit(amount, symbol);
        const tx = await solanaClient.stake(from, BigInt(lamports), WALLET_SDK_SOURCE);
        const { stakeTx } = tx.result;

        if (!isCompilableTransactionMessage(stakeTx)) {
            throw new Error('Transaction is not compilable');
        }

        const transformedTx = transformTx(stakeTx, path);

        return {
            success: true,
            tx: transformedTx,
        };
    } catch (e) {
        console.error(e);

        return {
            success: false,
            errorMessage: e.message,
        };
    }
};

export const prepareUnstakeSolTx = async ({
    from,
    path,
    amount,
    symbol,
    selectedBlockchain,
}: PrepareStakeSolTxParams): Promise<PrepareStakeSolTxResponse> => {
    try {
        const solanaClient = selectSolanaWalletSdkNetwork(symbol, selectedBlockchain.url);

        const lamports = networkAmountToSmallestUnit(amount, symbol);
        const tx = await solanaClient.unstake(from, BigInt(lamports), WALLET_SDK_SOURCE);
        const transformedTx = transformTx(tx.result.unstakeTx, path);

        return {
            success: true,
            tx: transformedTx,
        };
    } catch (e) {
        console.error(e);

        return {
            success: false,
            errorMessage: e.message,
        };
    }
};

type PrepareClaimSolTxParams = Omit<PrepareStakeSolTxParams, 'amount'>;

export const prepareClaimSolTx = async ({
    from,
    path,
    symbol,
    selectedBlockchain,
}: PrepareClaimSolTxParams): Promise<PrepareStakeSolTxResponse> => {
    try {
        const solanaClient = selectSolanaWalletSdkNetwork(symbol, selectedBlockchain.url);

        const tx = await solanaClient.claim(from);
        const transformedTx = transformTx(tx.result.claimTx, path);

        return {
            success: true,
            tx: transformedTx,
        };
    } catch (e) {
        console.error(e);

        return {
            success: false,
            errorMessage: e.message,
        };
    }
};
