import { compileTransaction } from '@solana/kit';

import type {
    CompilableTransactionMessage,
    PrepareClaimSolTxParams,
    PrepareStakeSolTxParams,
    PrepareStakeSolTxResponse,
    PriorityFees,
    TransactionMessageWithBlockhashLifetime,
} from '@connect-coins/solana/types';
import {
    SOL_COMPUTE_UNIT_LIMIT,
    SOL_COMPUTE_UNIT_PRICE,
    WALLET_SDK_SOURCE,
} from '@suite-common/wallet-constants';
import { networkAmountToSmallestUnit } from '@suite-common/wallet-utils';
import { type BlockbookFee as Fee } from '@trezor/blockchain-link-types';

import { claim, createTransactionShimCommon, stake, unstake } from './transactionUtils';

const transformTx = (
    tx: CompilableTransactionMessage & TransactionMessageWithBlockhashLifetime,
) => {
    const compilableTx = compileTransaction(tx);

    return createTransactionShimCommon(compilableTx);
};

// Type guard to check if transaction is of type CompilableTransactionMessage
function isCompilableTransactionMessage(
    tx: TransactionMessageWithBlockhashLifetime | CompilableTransactionMessage,
): tx is CompilableTransactionMessage {
    return (tx as CompilableTransactionMessage).feePayer !== undefined;
}

export const dummyPriorityFeesForFeeEstimation: PriorityFees = {
    computeUnitPrice: BigInt(SOL_COMPUTE_UNIT_PRICE),
    computeUnitLimit: SOL_COMPUTE_UNIT_LIMIT,
};

const getStakingParams = (estimatedFee?: Fee[number]) => {
    if (!estimatedFee || !estimatedFee.feePerUnit || !estimatedFee.feeLimit) {
        return dummyPriorityFeesForFeeEstimation;
    }

    return {
        computeUnitPrice: BigInt(estimatedFee.feePerUnit),
        computeUnitLimit: Number(estimatedFee.feeLimit), // solana package expects number
    };
};

export const prepareStakeSolTx = async ({
    from,
    amount,
    symbol,
    selectedBlockchain,
    estimatedFee,
}: PrepareStakeSolTxParams): Promise<PrepareStakeSolTxResponse> => {
    try {
        const lamports = networkAmountToSmallestUnit(amount, symbol);
        const params = getStakingParams(estimatedFee);
        const tx = await stake({
            network: symbol,
            sender: from,
            lamports: BigInt(lamports),
            source: WALLET_SDK_SOURCE,
            url: selectedBlockchain.url,
            params,
        });

        const { stakeTx } = tx;

        if (!isCompilableTransactionMessage(stakeTx)) {
            throw new Error('Transaction is not compilable');
        }

        const txShim = transformTx(stakeTx);

        return {
            success: true,
            txShim,
            solanaTxMeta: tx.txMeta,
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
    amount,
    symbol,
    selectedBlockchain,
    estimatedFee,
}: PrepareStakeSolTxParams): Promise<PrepareStakeSolTxResponse> => {
    try {
        const lamports = networkAmountToSmallestUnit(amount, symbol);
        const params = getStakingParams(estimatedFee);
        const tx = await unstake({
            network: symbol,
            sender: from,
            lamports: BigInt(lamports),
            source: WALLET_SDK_SOURCE,
            url: selectedBlockchain.url,
            params,
        });
        const txShim = transformTx(tx.unstakeTx);

        return {
            success: true,
            txShim,
            solanaTxMeta: tx.txMeta,
        };
    } catch (e) {
        console.error(e);

        return {
            success: false,
            errorMessage: e.message,
        };
    }
};

export const prepareClaimSolTx = async ({
    from,
    symbol,
    selectedBlockchain,
    estimatedFee,
}: PrepareClaimSolTxParams): Promise<PrepareStakeSolTxResponse> => {
    try {
        const params = getStakingParams(estimatedFee);
        const tx = await claim({
            network: symbol,
            sender: from,
            url: selectedBlockchain.url,
            params,
        });
        const txShim = transformTx(tx.claimTx);

        return {
            success: true,
            txShim,
            solanaTxMeta: tx.txMeta,
        };
    } catch (e) {
        console.error(e);

        return {
            success: false,
            errorMessage: e.message,
        };
    }
};
