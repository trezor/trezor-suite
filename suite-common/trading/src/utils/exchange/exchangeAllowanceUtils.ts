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

const getExchangeApprovalSpender = (quote?: ExchangeTrade): string | undefined =>
    getErc20ApproveSpender(quote?.dexTx?.data);

export const hasExistingAllowance = (quote: ExchangeTrade, currentAllowance: string | undefined) =>
    new BigNumber(currentAllowance ?? quote.preapprovedStringAmount ?? 0).gt(0);

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
    coveredRatio: number;
    requiresReset: boolean;
};

type GetExchangeAllowanceCoverageParams = {
    amount: string;
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
        requiresReset: false,
    };

    if (!allowed.gt(0)) {
        return base;
    }

    if (isAllowanceUnlimited({ amount, decimals })) {
        return { ...base, kind: 'unlimited', coveredRatio: 1 };
    }

    const needed = neededAmount !== undefined ? new BigNumber(neededAmount) : undefined;

    if (!needed?.gt(0)) {
        return { ...base, kind: 'enough', coveredRatio: 1 };
    }

    if (allowed.lt(needed)) {
        return {
            ...base,
            kind: 'too_low',
            coveredRatio: allowed.div(needed).toNumber(),
            requiresReset: !tokenSupportsIncreasingAllowance(tokenContractAddress),
        };
    }

    return { ...base, kind: 'enough', coveredRatio: 1 };
};
