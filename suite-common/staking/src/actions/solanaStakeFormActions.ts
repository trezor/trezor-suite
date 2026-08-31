import { type NetworkSymbol } from '@suite-common/wallet-config';
import {
    type ComposeActionContext,
    type ExternalOutput,
    type PrecomposedLevels,
    type PrecomposedTransaction,
    type StakeFormState,
    type StakeType,
} from '@suite-common/wallet-types';
import {
    isSupportedSolStakingNetworkSymbol,
    networkAmountToSmallestUnit,
} from '@suite-common/wallet-utils';
import TrezorConnect, { type FeeLevel } from '@trezor/connect';
import { asCoinSymbol } from '@trezor/connect-common';
import {
    MIN_SOL_AMOUNT_FOR_STAKING,
    MIN_SOL_BALANCE_FOR_STAKING,
    MIN_SOL_FOR_WITHDRAWALS,
    SOL_STAKING_OPERATION_FEE,
    type SolanaNetworkSymbol,
} from '@trezor/network-solana/constants';
import solana from '@trezor/network-solana/runtime';
import type {
    EstimatedFee,
    Fee,
    PrepareStakeSolTxResponse,
    SolanaTxMeta,
} from '@trezor/network-solana/types';
import { BigNumber } from '@trezor/utils';

import { calculate, composeStakingTransaction } from './stakeFormActions';

// Rent-aware Solana stake fee calc for `composeStakingTransaction` / `calculate`.
const calculateSolanaStakeTransaction = (
    availableBalance: string,
    output: ExternalOutput,
    feeLevel: FeeLevel,
    compareWithAmount: boolean,
    symbol: NetworkSymbol,
    estimatedFee?: EstimatedFee,
): PrecomposedTransaction => {
    const feeInLamports =
        estimatedFee?.payload?.feePerTx ?? new BigNumber(SOL_STAKING_OPERATION_FEE).toString();

    const stakingParams = {
        feeInBaseUnits: feeInLamports,
        minBalanceForStakingInBaseUnits: networkAmountToSmallestUnit(
            MIN_SOL_BALANCE_FOR_STAKING.toString(),
            symbol,
        ),
        minAmountForStakingInBaseUnits: networkAmountToSmallestUnit(
            MIN_SOL_AMOUNT_FOR_STAKING.toString(),
            symbol,
        ),
        minAmountForWithdrawalInBaseUnits: networkAmountToSmallestUnit(
            MIN_SOL_FOR_WITHDRAWALS.toString(),
            symbol,
        ),
    };

    const estimatedFeeLevel = { ...feeLevel, ...estimatedFee?.payload };

    return calculate(
        availableBalance,
        output,
        estimatedFeeLevel,
        compareWithAmount,
        symbol,
        stakingParams,
        estimatedFee,
    );
};

// A split instruction cannot be recreated in Suite, such a transaction is reviewed on the device only.
const applyDeviceReviewOnly = (
    composed: PrecomposedLevels,
    isDeviceReviewOnly: boolean,
): PrecomposedLevels =>
    Object.fromEntries(
        Object.entries(composed).map(([key, tx]) =>
            tx.type === 'error' ? [key, tx] : [key, { ...tx, isDeviceReviewOnly }],
        ),
    );

// Merges solanaTxMeta (rent, fee) into each fee level for device review amounts.
const applySolanaTxMeta = (
    composed: PrecomposedLevels,
    solanaTxMeta: SolanaTxMeta,
): PrecomposedLevels =>
    Object.fromEntries(
        Object.entries(applyDeviceReviewOnly(composed, solanaTxMeta.hasSplitInstruction)).map(
            ([key, tx]) => {
                if (tx.type === 'error') return [key, tx];

                const nextTx = { ...tx, solanaTxMeta };

                if (tx.type === 'final') {
                    const totalSpent = new BigNumber(solanaTxMeta.deviceAmountLamports)
                        .plus(solanaTxMeta.feeIncludingRentLamports)
                        .toString();

                    return [
                        key,
                        {
                            ...nextTx,
                            fee: solanaTxMeta.feeIncludingRentLamports,
                            totalSpent,
                        },
                    ];
                }

                return [key, nextTx];
            },
        ),
    );

// Turns a prepared staking transaction into a message and asks the backend to estimate its fee.
const estimateSolanaStakeFee = async (
    symbol: NetworkSymbol,
    txData?: PrepareStakeSolTxResponse,
): Promise<EstimatedFee> => {
    if (!txData?.success) return { success: false };

    const createsStakeAccount = txData.solanaTxMeta.rentLamports !== '0';

    const estimatedFee = await TrezorConnect.blockchainEstimateFee({
        coin: asCoinSymbol(symbol),
        request: {
            specific: {
                data: txData.txShim.serialize(),
                ...(createsStakeAccount ? { newAccountProgramName: 'staking' } : {}),
            },
        },
    });

    if (estimatedFee?.success) {
        // The Solana worker always returns an array of size 1.
        return { success: true, payload: estimatedFee.payload.levels[0] };
    }

    return { success: false };
};

type PrepareSolanaStakeTxDataParams = {
    from: string;
    symbol: SolanaNetworkSymbol;
    amount: string;
    stakeType: StakeType;
    blockchainUrl: string;
    userAgent: string;
    estimatedFee?: Fee;
    source?: string;
};

// Builds stake/unstake/claim tx via Solana runtime; `userAgent` differs for Suite vs Lite.
export const prepareSolanaStakeTxData = async ({
    from,
    symbol,
    amount,
    stakeType,
    blockchainUrl,
    userAgent,
    estimatedFee,
    source,
}: PrepareSolanaStakeTxDataParams): Promise<PrepareStakeSolTxResponse | undefined> => {
    const {
        selectSolanaConnection,
        selectSolanaValidator,
        prepareStakeSolTx,
        prepareUnstakeSolTx,
        prepareClaimSolTx,
    } = await solana();

    const connection = selectSolanaConnection(blockchainUrl, userAgent);
    const validator = selectSolanaValidator(symbol);

    if (stakeType === 'stake') {
        return prepareStakeSolTx({ from, amount, connection, validator, estimatedFee, source });
    }

    if (stakeType === 'unstake') {
        return prepareUnstakeSolTx({ from, amount, connection, validator, estimatedFee, source });
    }

    if (stakeType === 'claim') {
        return prepareClaimSolTx({ from, connection, estimatedFee });
    }

    return undefined;
};

type ComposeSolanaStakingTransactionParams = {
    formValues: StakeFormState;
    composeContext: ComposeActionContext;
    blockchainUrl: string;
    userAgent: string;
    source?: string;
};

// Solana stake compose: build tx, estimate fee, rebuild with fee and solanaTxMeta (not send-form).
export const composeSolanaStakingTransaction = async ({
    formValues,
    composeContext,
    blockchainUrl,
    userAgent,
    source,
}: ComposeSolanaStakingTransactionParams): Promise<PrecomposedLevels | undefined> => {
    const { account, feeInfo } = composeContext;
    const amount = formValues.outputs[0]?.amount;
    const { stakeType } = formValues;

    if (!amount || amount === '0') return undefined;
    if (!feeInfo) return undefined;
    if (account.networkType !== 'solana' || !isSupportedSolStakingNetworkSymbol(account.symbol)) {
        return undefined;
    }

    const txData = await prepareSolanaStakeTxData({
        from: account.descriptor,
        symbol: account.symbol,
        amount,
        stakeType,
        blockchainUrl,
        userAgent,
        source,
    });

    const estimatedFee = await estimateSolanaStakeFee(account.symbol, txData);

    const predefinedLevels = feeInfo.levels.filter(level => level.label !== 'custom');

    const composed = composeStakingTransaction(
        formValues,
        composeContext,
        predefinedLevels,
        calculateSolanaStakeTransaction,
        estimatedFee,
        undefined,
    );
    if (!composed) return undefined;

    if (estimatedFee.success && estimatedFee.payload) {
        const txDataWithFee = await prepareSolanaStakeTxData({
            from: account.descriptor,
            symbol: account.symbol,
            amount,
            stakeType,
            blockchainUrl,
            userAgent,
            source,
            estimatedFee: estimatedFee.payload,
        });

        if (txDataWithFee?.success) {
            return applySolanaTxMeta(composed, txDataWithFee.solanaTxMeta);
        }
    }

    // Fee estimation or the fee-aware preparation failed, keep the review-only flag of the first tx.
    return applyDeviceReviewOnly(
        composed,
        !!txData?.success && txData.solanaTxMeta.hasSplitInstruction,
    );
};
