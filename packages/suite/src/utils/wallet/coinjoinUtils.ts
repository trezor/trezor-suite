import BigNumber from 'bignumber.js';

import { CoinjoinStatusEvent, RegisterAccountParams } from '@trezor/coinjoin';
import { getUtxoOutpoint, getBip43Type } from '@suite-common/wallet-utils';
import { Account, CoinjoinSessionParameters } from '@suite-common/wallet-types';
import {
    ESTIMATED_ANONYMITY_GAINED_PER_ROUND,
    ESTIMATED_HOURS_PER_ROUND_WITHOUT_SKIPPING_ROUNDS,
    ESTIMATED_HOURS_PER_ROUND_WITH_SKIPPING_ROUNDS,
} from '@suite/services/coinjoin/config';

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

/**
 * Transform from coordinator format to coinjoinReducer format `CoinjoinClientFeeRatesMedians`
 * array => object { name: value-in-vBytes }
 */
export const transformFeeRatesMedians = (medians: CoinjoinStatusEvent['feeRatesMedians']) => {
    const [fast, recommended] = medians.map(m => m.medianFeeRate);
    // convert from kvBytes (kilo virtual bytes) to vBytes (how the value is displayed in UI)
    const kvB2vB = (v: number) => (v ? Math.round(v / 1000) : 1);

    return {
        fast: kvB2vB(fast) * 2, // NOTE: this calculation will be smarter once have enough data
        recommended: kvB2vB(recommended),
    };
};

/**
 * Transform from coordinator format to coinjoinReducer format `CoinjoinClientInstance`
 * - coordinatorFeeRate: multiply the amount registered for coinjoin by this value to get the total fee
 * - feeRatesMedians: array => object with values in kvBytes
 */
export const transformCoinjoinStatus = (event: CoinjoinStatusEvent) => ({
    rounds: event.rounds.map(r => ({ id: r.id, phase: r.phase })),
    coordinatorFeeRate: event.coordinatorFeeRate,
    feeRatesMedians: transformFeeRatesMedians(event.feeRatesMedians),
});

// convert suite account type to @trezor/coinjoin RegisterAccountParams scriptType
const getCoinjoinAccountScriptType = (path: string) => {
    const bip43 = getBip43Type(path);
    switch (bip43) {
        case 'bip86':
        case 'slip25':
            return 'Taproot';
        case 'bip84':
            return 'P2WPKH';
        default:
            return 'P2WPKH';
    }
};

// use only confirmed utxos, map to @trezor/coinjoin RegisterAccountParams utxos
const getCoinjoinAccountUtxos = (utxos: Account['utxo'], anonymitySet: any = {}) =>
    utxos
        ?.filter(utxo => utxo.confirmations)
        .map(utxo => ({
            path: utxo.path,
            outpoint: getUtxoOutpoint(utxo),
            amount: Number(utxo.amount),
            anonymityLevel: anonymitySet[utxo.address] || 1,
        })) || [];

// select only addresses without tx history
const getCoinjoinAccountAddresses = (addresses: Account['addresses']) =>
    addresses?.change.filter(a => !a.transfers) || [];

/**
 * Transform from suite Account to @trezor/coinjoin RegisterAccountParams
 */
export const getRegisterAccountParams = (
    account: Account,
    params: CoinjoinSessionParameters,
): RegisterAccountParams => ({
    scriptType: getCoinjoinAccountScriptType(account.path),
    accountKey: account.key,
    targetAnonymity: params.targetAnonymity,
    maxRounds: params.maxRounds,
    skipRounds: params.skipRounds,
    maxFeePerKvbyte: params.maxFeePerKvbyte,
    maxCoordinatorFeeRate: params.maxCoordinatorFeeRate,
    utxos: getCoinjoinAccountUtxos(account.utxo, account.addresses?.anonymitySet),
    changeAddresses: getCoinjoinAccountAddresses(account.addresses),
});

// calculate max rounds from anonymity levels
export const getMaxRounds = (
    targetAnonymity: number,
    anonymitySet: Record<string, number | undefined>,
) => {
    // fallback to 1 if any value is undefined or the object is empty
    const lowestAnonymity = Math.min(...(Object.values(anonymitySet).map(item => item ?? 1) || 1));
    return Math.ceil((targetAnonymity - lowestAnonymity) / ESTIMATED_ANONYMITY_GAINED_PER_ROUND);
};

// get time estimate in hours per round
export const getEstimatedTimePerRound = (skipRounds: boolean) =>
    skipRounds
        ? ESTIMATED_HOURS_PER_ROUND_WITH_SKIPPING_ROUNDS
        : ESTIMATED_HOURS_PER_ROUND_WITHOUT_SKIPPING_ROUNDS;
