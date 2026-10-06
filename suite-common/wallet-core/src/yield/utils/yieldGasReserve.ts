import {
    YIELD_GAS_LIMIT_APPROVE,
    YIELD_GAS_LIMIT_UNWRAP,
    YIELD_GAS_LIMIT_VAULT_DEPOSIT,
    YIELD_GAS_LIMIT_VAULT_WITHDRAW,
    YIELD_GAS_LIMIT_WRAP,
    YIELD_GAS_RESERVE_CAP,
    YIELD_GAS_RESERVE_ENTRY_MULTIPLIER,
    YIELD_GAS_RESERVE_EXIT_MULTIPLIER,
    YIELD_GAS_RESERVE_FALLBACK,
    YIELD_GAS_RESERVE_FLOOR,
} from '@suite-common/wallet-constants';
import { tokenSupportsIncreasingAllowance } from '@suite-common/wallet-utils';
import { type FeeLevel } from '@trezor/connect';
import { BigNumber } from '@trezor/utils';

import type { YieldGasReserve, YieldNativeFeeStatus } from '../yieldTypes';

const AMOUNT_LADDER_STEPS = [1, 2, 5, 10];
const GWEI_DECIMALS = 9;

export const FALLBACK_YIELD_GAS_RESERVE: YieldGasReserve = {
    minimum: YIELD_GAS_RESERVE_FALLBACK.toFixed(),
    recommended: YIELD_GAS_RESERVE_FALLBACK.toFixed(),
};

/** Rounds up to the nearest 1 / 2 / 5 × 10ⁿ so the reserve reads as a round figure. */
export const roundUpToAmountLadder = (value: BigNumber): BigNumber => {
    if (!value.isFinite() || value.lte(0)) {
        return new BigNumber(0);
    }

    const exponent = value.e ?? 0;
    const mantissa = value.shiftedBy(-exponent);
    const step = AMOUNT_LADDER_STEPS.find(candidate => mantissa.lte(candidate)) ?? 10;

    return new BigNumber(step).shiftedBy(exponent);
};

const getFeePerGasGwei = (feeLevel: FeeLevel): BigNumber | null => {
    const feePerGas = new BigNumber(feeLevel.maxFeePerGas ?? feeLevel.feePerUnit);

    return feePerGas.isFinite() && feePerGas.gt(0) ? feePerGas : null;
};

const getBoundedReserve = (gasCost: BigNumber, feePerGasGwei: BigNumber): string => {
    const reserve = roundUpToAmountLadder(gasCost.times(feePerGasGwei).shiftedBy(-GWEI_DECIMALS));

    return BigNumber.max(
        YIELD_GAS_RESERVE_FLOOR,
        BigNumber.min(YIELD_GAS_RESERVE_CAP, reserve),
    ).toFixed();
};

type GetYieldGasReserveParams = {
    /** Fee level in gwei, as converted by `selectConvertedNetworkFeeInfo`. */
    feeLevel: FeeLevel | null | undefined;
    isWrappedNativeVault: boolean;
    tokenContractAddress?: string | null;
};

/**
 * Native coin to keep aside for the fees of a yield deposit: `minimum` covers the entry
 * transactions (wrap for a wrapped-native vault, approve, deposit), `recommended` also the exit
 * ones (withdraw, unwrap) at a larger margin since they happen at an unknown future fee.
 * `null` when no usable fee estimate is available.
 */
export const getYieldGasReserve = ({
    feeLevel,
    isWrappedNativeVault,
    tokenContractAddress,
}: GetYieldGasReserveParams): YieldGasReserve | null => {
    if (!feeLevel) return null;

    const feePerGasGwei = getFeePerGasGwei(feeLevel);

    if (!feePerGasGwei) return null;

    // Tokens without increaseAllowance (USDT) need a reset approve before a new one.
    const approveCount = tokenSupportsIncreasingAllowance(tokenContractAddress ?? undefined)
        ? 1
        : 2;

    const entryGas =
        (isWrappedNativeVault ? YIELD_GAS_LIMIT_WRAP : 0) +
        YIELD_GAS_LIMIT_APPROVE * approveCount +
        YIELD_GAS_LIMIT_VAULT_DEPOSIT;

    const exitGas =
        YIELD_GAS_LIMIT_VAULT_WITHDRAW + (isWrappedNativeVault ? YIELD_GAS_LIMIT_UNWRAP : 0);

    const entryGasCost = new BigNumber(entryGas).times(YIELD_GAS_RESERVE_ENTRY_MULTIPLIER);
    const exitGasCost = new BigNumber(exitGas).times(YIELD_GAS_RESERVE_EXIT_MULTIPLIER);

    return {
        minimum: getBoundedReserve(entryGasCost, feePerGasGwei),
        recommended: getBoundedReserve(entryGasCost.plus(exitGasCost), feePerGasGwei),
    };
};

type GetYieldNativeFeeStatusParams = {
    /** Native coin balance in display units, NOT subunits. */
    nativeBalance: string;
    reserve: YieldGasReserve;
    isWrapStep: boolean;
    isWrappedNativeVault: boolean;
};

/**
 * Whether the native balance covers the deposit's fees. The wrap step is blocked unless something
 * is left to wrap above the recommended reserve. The later steps block below the minimum and,
 * for a token vault, recommend a top-up below the recommended reserve; a wrapped-native vault
 * already kept that reserve aside in the wrap step, so it gets no top-up recommendation.
 */
export const getYieldNativeFeeStatus = ({
    nativeBalance,
    reserve,
    isWrapStep,
    isWrappedNativeVault,
}: GetYieldNativeFeeStatusParams): YieldNativeFeeStatus => {
    const balance = new BigNumber(nativeBalance || '0');

    if (!balance.isFinite()) {
        return 'insufficient';
    }

    if (isWrapStep) {
        return balance.lte(reserve.recommended) ? 'insufficient' : 'sufficient';
    }

    if (balance.lt(reserve.minimum)) {
        return 'insufficient';
    }

    if (!isWrappedNativeVault && balance.lt(reserve.recommended)) {
        return 'below-recommended';
    }

    return 'sufficient';
};
