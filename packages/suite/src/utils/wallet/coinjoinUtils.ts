import BigNumber from 'bignumber.js';
import { getUtxoOutpoint } from '@suite-common/wallet-utils';
import { Account } from '@suite-common/wallet-types';

export type CoinjoinBalanceBreakdown = {
    notAnonymized: string;
    anonymizing: string;
    anonymized: string;
};

/**
 * Breaks down account balance based on anonymity status
 */
export const breakdownCoinjoinBalance = ({
    targetAnonymity,
    anonymitySet,
    utxos,
    registeredUtxos,
}: {
    targetAnonymity: number | undefined;
    anonymitySet: Record<string, number | undefined> | undefined;
    utxos: Account['utxo'];
    registeredUtxos?: string[];
}): CoinjoinBalanceBreakdown => {
    const balanceBreakdown = {
        notAnonymized: '0',
        anonymizing: '0',
        anonymized: '0',
    };

    if (!anonymitySet || targetAnonymity === undefined || !utxos) {
        return balanceBreakdown;
    }

    utxos?.forEach(({ address, amount, txid, vout }) => {
        const outpoint = getUtxoOutpoint({ txid, vout });
        const bigAmount = new BigNumber(amount);
        const { notAnonymized, anonymizing, anonymized } = balanceBreakdown;

        if (registeredUtxos?.includes(outpoint)) {
            const newAnonymizing = new BigNumber(anonymizing).plus(bigAmount);

            balanceBreakdown.anonymizing = newAnonymizing.toString();
        } else if ((anonymitySet[address] || 0) < targetAnonymity) {
            const newNotAnonymized = new BigNumber(notAnonymized).plus(bigAmount);

            balanceBreakdown.notAnonymized = newNotAnonymized.toString();
        } else if ((anonymitySet[address] || 0) >= targetAnonymity) {
            const newAnonymized = new BigNumber(anonymized).plus(bigAmount);

            balanceBreakdown.anonymized = newAnonymized.toString();
        }
    });

    return balanceBreakdown;
};
