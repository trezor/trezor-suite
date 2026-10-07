import type { Transaction } from '@trezor/blockchain-link-types';

const ONE_HOUR_IN_SECONDS = 60 * 60;

/** Rates are kept per hour: transactions of one hour are valued at one rate. */
export const toRateHour = (blockTime: number) =>
    Math.floor(blockTime / ONE_HOUR_IN_SECONDS) * ONE_HOUR_IN_SECONDS;

export type HistoricRateRequest = {
    /** `undefined` for the network's coin. */
    contract?: string;

    /** Hours, ascending and unique. */
    timestamps: readonly number[];
};

/**
 * What to ask past rates for, for one page of history: the coin at the hour of every confirmed
 * transaction, and each token at the hours it was moved. Pending transactions have no time yet.
 */
export const getHistoricRateRequests = (
    transactions: readonly Transaction[],
): HistoricRateRequest[] => {
    const hoursByAsset = new Map<string | undefined, Set<number>>();
    const addHour = (contract: string | undefined, hour: number) => {
        const hours = hoursByAsset.get(contract) ?? new Set<number>();
        hours.add(hour);
        hoursByAsset.set(contract, hours);
    };

    transactions.forEach(transaction => {
        if (!transaction.blockTime) return;

        const hour = toRateHour(transaction.blockTime);
        addHour(undefined, hour);
        transaction.tokens.forEach(token => addHour(token.contract, hour));
    });

    return [...hoursByAsset].map(([contract, hours]) => ({
        contract,
        timestamps: [...hours].sort((a, b) => a - b),
    }));
};
