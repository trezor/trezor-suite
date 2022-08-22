import type { Transaction, LightTx } from './types';

const PAGE_SIZE_DEFAULT = 25;

export const getPagination = (txCount: number, perPage = PAGE_SIZE_DEFAULT) => ({
    index: 1,
    size: perPage,
    total: Math.ceil(txCount / perPage),
});

export const isTxConfirmed = ({ blockHeight }: { blockHeight?: number }) => (blockHeight ?? 0) > 0;

export const doesTxContainAddress =
    (address: string) =>
    ({ vin, vout }: LightTx) =>
        vin
            .concat(vout)
            .flatMap(({ addresses = [] }) => addresses)
            .includes(address);

export const calculateBalance = (transactions: Transaction[]) =>
    transactions.reduce<[number, number]>(
        ([confirmed, unconfirmed], { type, totalSpent, blockHeight = -1 }) => {
            if (!['recv', 'sent', 'self'].includes(type)) {
                return [confirmed, unconfirmed];
            }
            const value = Number.parseInt(totalSpent, 10);
            const delta = type === 'recv' ? value : -value;
            return blockHeight > 0
                ? [confirmed + delta, unconfirmed]
                : [confirmed, unconfirmed + delta];
        },
        [0, 0],
    );
