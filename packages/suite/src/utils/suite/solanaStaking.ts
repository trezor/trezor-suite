import {
    CompilableTransactionMessage,
    TransactionMessageWithBlockhashLifetime,
    compileTransaction,
} from '@solana/kit';

import {
    SolanaTx,
    claim,
    createTransactionShimCommon,
    stake,
    unstake,
} from '@suite-common/staking-solana';
import {
    SOL_COMPUTE_UNIT_LIMIT,
    SOL_COMPUTE_UNIT_PRICE,
    WALLET_SDK_SOURCE,
} from '@suite-common/wallet-constants';
import {
    PrepareClaimSolTxParams,
    PrepareStakeSolTxParams,
    PrepareStakeSolTxResponse,
    PriorityFees,
} from '@suite-common/wallet-types';
import { networkAmountToSmallestUnit } from '@suite-common/wallet-utils';
import { Fee } from '@trezor/blockchain-link-types/src/blockbook';

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
        сomputeUnitPrice: BigInt(estimatedFee.feePerUnit),
        computeUnitLimit: Number(estimatedFee.feeLimit), // solana package expects number
    };
};

export const prepareStakeSolTx = async ({
    from,
    path,
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
        const transformedTx = transformTx(tx.unstakeTx, path);

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

export const prepareClaimSolTx = async ({
    from,
    path,
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
        const transformedTx = transformTx(tx.claimTx, path);

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
