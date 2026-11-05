import { type ExchangeTrade } from 'invity-api';

import { type AccountKey } from '@suite-common/wallet-types';
import {
    getErc20ApproveSpender,
    isAllowanceUnlimited,
    tokenSupportsIncreasingAllowance,
} from '@suite-common/wallet-utils';
import { BigNumber } from '@trezor/utils';

import { type TradingExchangeAllowance, type TradingExchangeAllowanceKey } from '../../types';
import { parseCryptoId } from '../../utils';

export type ExchangeAllowanceSource = 'chain' | 'provider';

export type ExchangeCurrentAllowance = {
    /** Allowance in token units. */
    amount: string;
    source: ExchangeAllowanceSource;
};

export const isSameExchangeAllowanceKey = (
    first: TradingExchangeAllowanceKey,
    second: TradingExchangeAllowanceKey,
): boolean =>
    first.accountKey === second.accountKey &&
    first.tokenContractAddress.toLowerCase() === second.tokenContractAddress.toLowerCase() &&
    first.spender.toLowerCase() === second.spender.toLowerCase();

/**
 * The spender is known only from the approve calldata the provider attached to the quote.
 * A swap transaction does not carry it.
 */
export const getExchangeApprovalSpender = (quote?: ExchangeTrade): string | undefined =>
    getErc20ApproveSpender(quote?.dexTx?.data);

type GetExchangeAllowanceKeyParams = {
    accountKey: AccountKey | undefined;
    quote: ExchangeTrade | undefined;
};

export const getExchangeAllowanceKey = ({
    accountKey,
    quote,
}: GetExchangeAllowanceKeyParams): TradingExchangeAllowanceKey | undefined => {
    if (!accountKey || !quote?.send) {
        return undefined;
    }

    const { contractAddress } = parseCryptoId(quote.send);
    const spender = getExchangeApprovalSpender(quote);

    if (!contractAddress || !spender) {
        return undefined;
    }

    return { accountKey, tokenContractAddress: contractAddress, spender };
};

type GetExchangeCurrentAllowanceParams = {
    allowance: TradingExchangeAllowance | undefined;
    quote: ExchangeTrade | undefined;
};

/**
 * The chain is the source of truth. The provider amount only bridges the time before the first
 * read finishes and the case when the chain cannot be read.
 */
export const getExchangeCurrentAllowance = ({
    allowance,
    quote,
}: GetExchangeCurrentAllowanceParams): ExchangeCurrentAllowance =>
    allowance?.amount !== undefined
        ? { amount: allowance.amount, source: 'chain' }
        : { amount: quote?.preapprovedStringAmount ?? '0', source: 'provider' };

export type ExchangeAllowanceCoverageKind = 'none' | 'too_low' | 'enough' | 'unlimited';

export type ExchangeAllowanceCoverage = {
    kind: ExchangeAllowanceCoverageKind;
    /** Fraction of the needed amount the allowance covers, capped at 1. */
    coveredRatio: number;
    /** Where the needed amount sits on a meter spanning the allowance, 1 when it is not covered. */
    neededRatio: number;
    /** Token units the allowance lacks for the swap. */
    missingAmount: string | undefined;
    /** Token units left in the allowance after the swap. */
    remainingAmount: string | undefined;
    /** The token cannot raise a non-zero allowance, so a revoke must come first. */
    requiresReset: boolean;
};

type GetExchangeAllowanceCoverageParams = {
    /** Allowance in token units. */
    amount: string;
    /** Token units the swap spends. */
    neededAmount: string | undefined;
    decimals: number;
    tokenContractAddress: string;
};

export const getExchangeAllowanceCoverage = ({
    amount,
    neededAmount,
    decimals,
    tokenContractAddress,
}: GetExchangeAllowanceCoverageParams): ExchangeAllowanceCoverage => {
    const allowed = new BigNumber(amount);
    const base: ExchangeAllowanceCoverage = {
        kind: 'none',
        coveredRatio: 0,
        neededRatio: 1,
        missingAmount: undefined,
        remainingAmount: undefined,
        requiresReset: false,
    };

    if (!allowed.gt(0)) {
        return base;
    }

    if (isAllowanceUnlimited({ amount, decimals })) {
        return { ...base, kind: 'unlimited', coveredRatio: 1, neededRatio: 0 };
    }

    const needed = neededAmount !== undefined ? new BigNumber(neededAmount) : undefined;

    if (!needed?.gt(0)) {
        return { ...base, kind: 'enough', coveredRatio: 1, neededRatio: 1 };
    }

    if (allowed.lt(needed)) {
        return {
            ...base,
            kind: 'too_low',
            coveredRatio: allowed.div(needed).toNumber(),
            neededRatio: 1,
            missingAmount: needed.minus(allowed).toFixed(),
            requiresReset: !tokenSupportsIncreasingAllowance(tokenContractAddress),
        };
    }

    return {
        ...base,
        kind: 'enough',
        coveredRatio: 1,
        neededRatio: needed.div(allowed).toNumber(),
        remainingAmount: allowed.minus(needed).toFixed(),
    };
};
