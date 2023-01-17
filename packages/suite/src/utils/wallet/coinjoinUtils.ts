import BigNumber from 'bignumber.js';
import { createHash } from 'crypto';

import { getUtxoOutpoint, getBip43Type } from '@suite-common/wallet-utils';
import {
    Account,
    SelectedAccountStatus,
    WalletAccountTransaction,
} from '@suite-common/wallet-types';
import {
    CoinjoinSession,
    CoinjoinSessionParameters,
    RoundPhase,
    SessionPhase,
} from '@wallet-types/coinjoin';
import {
    ESTIMATED_ANONYMITY_GAINED_PER_ROUND,
    ESTIMATED_MIN_ROUNDS_NEEDED,
    ESTIMATED_ROUNDS_FAIL_RATE_BUFFER,
    ESTIMATED_HOURS_PER_ROUND,
} from '@suite/services/coinjoin/config';
import { AnonymitySet } from '@trezor/blockchain-link';
import {
    CoinjoinStatusEvent,
    RegisterAccountParams,
    CoinjoinTransactionData,
} from '@trezor/coinjoin';
import { AccountUtxo } from '@trezor/connect';

export type CoinjoinBalanceBreakdown = {
    notAnonymized: string;
    anonymized: string;
};

/**
 * Breaks down account balance based on anonymity status
 */
export const breakdownCoinjoinBalance = ({
    targetAnonymity,
    anonymitySet,
    utxos,
}: {
    targetAnonymity: number | undefined;
    anonymitySet: AnonymitySet | undefined;
    utxos: Account['utxo'];
}): CoinjoinBalanceBreakdown => {
    const balanceBreakdown = {
        notAnonymized: '0',
        anonymized: '0',
    };

    if (!anonymitySet || targetAnonymity === undefined || !utxos) {
        return balanceBreakdown;
    }

    utxos?.forEach(({ address, amount }) => {
        const bigAmount = new BigNumber(amount);
        const { notAnonymized, anonymized } = balanceBreakdown;

        if ((anonymitySet[address] || 0) < targetAnonymity) {
            const newNotAnonymized = new BigNumber(notAnonymized).plus(bigAmount);

            balanceBreakdown.notAnonymized = newNotAnonymized.toString();
        } else {
            const newAnonymized = new BigNumber(anonymized).plus(bigAmount);

            balanceBreakdown.anonymized = newAnonymized.toString();
        }
    });

    return balanceBreakdown;
};

/**
 * Calculates account anonymity progress – how much UTXOs are anonymized relatively to the target anonymity
 */
export const calculateAnonymityProgress = ({
    targetAnonymity,
    anonymitySet,
    utxos,
}: {
    targetAnonymity: number | undefined;
    anonymitySet: AnonymitySet | undefined;
    utxos: Account['utxo'];
}): number => {
    if (!anonymitySet || targetAnonymity === undefined || !utxos || !utxos.length) {
        return 0;
    }

    if (targetAnonymity === 1) {
        return 100;
    }

    let weightedCurrentAnonymity = new BigNumber(0);
    let weightedTargetAnonymity = new BigNumber(0);

    utxos?.forEach(({ address, amount }) => {
        const bigAmount = new BigNumber(amount);

        const currentAnonymity = anonymitySet[address] || 1;

        weightedCurrentAnonymity = weightedCurrentAnonymity.plus(
            bigAmount.times(Math.min(currentAnonymity, targetAnonymity) - 1),
        );
        weightedTargetAnonymity = weightedTargetAnonymity.plus(
            bigAmount.times(targetAnonymity - 1),
        );
    });

    return weightedCurrentAnonymity
        .div(weightedTargetAnonymity)
        .times(100)
        .integerValue()
        .toNumber();
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
    coordinationFeeRate: event.coordinationFeeRate,
    feeRatesMedians: transformFeeRatesMedians(event.feeRatesMedians),
    allowedInputAmounts: event.allowedInputAmounts,
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
            address: utxo.address,
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
    rawLiquidityClue: RegisterAccountParams['rawLiquidityClue'],
): RegisterAccountParams => ({
    scriptType: getCoinjoinAccountScriptType(account.path),
    accountKey: account.key,
    targetAnonymity: params.targetAnonymity,
    rawLiquidityClue,
    maxRounds: params.maxRounds,
    skipRounds: params.skipRounds,
    maxFeePerKvbyte: params.maxFeePerKvbyte,
    maxCoordinatorFeeRate: params.maxCoordinatorFeeRate,
    utxos: getCoinjoinAccountUtxos(account.utxo, account.addresses?.anonymitySet),
    changeAddresses: getCoinjoinAccountAddresses(account.addresses),
});

// calculate max rounds from anonymity levels
export const getMaxRounds = (targetAnonymity: number, anonymitySet: AnonymitySet) => {
    // fallback to 1 if any value is undefined or the object is empty
    const lowestAnonymity = Math.min(...(Object.values(anonymitySet).map(item => item ?? 1) || 1));
    const estimatedRoundsCount = Math.ceil(
        ((targetAnonymity - lowestAnonymity) / ESTIMATED_ANONYMITY_GAINED_PER_ROUND) *
            ESTIMATED_ROUNDS_FAIL_RATE_BUFFER,
    );
    return Math.max(estimatedRoundsCount, ESTIMATED_MIN_ROUNDS_NEEDED);
};

// get time estimate in hours per round
export const getEstimatedTimePerRound = (skipRounds?: [number, number]) =>
    skipRounds
        ? ESTIMATED_HOURS_PER_ROUND * (skipRounds[1] / skipRounds[0])
        : ESTIMATED_HOURS_PER_ROUND;

/**
 * Transform @trezor/coinjoin CoinjoinRequestEvent.CoinjoinTransactionData to @trezor/connect signTransaction params
 * Params are profiled by account since multiple account can participate in one CoinjoinRound
 */
export const prepareCoinjoinTransaction = (
    account: Account,
    transaction: CoinjoinTransactionData,
) => {
    const inputScriptType = account.accountType === 'normal' ? 'SPENDWITNESS' : 'SPENDTAPROOT';
    const outputScriptType = account.accountType === 'normal' ? 'PAYTOWITNESS' : 'PAYTOTAPROOT';
    const isInternalInput = (input: CoinjoinTransactionData['inputs'][0]) =>
        input.path && account.utxo?.find(u => getUtxoOutpoint(u) === input.outpoint);
    const isInternalOutput = (output: CoinjoinTransactionData['outputs'][0]) =>
        output.path && account.addresses?.change.find(a => a.address === output.address);

    // TODO: early validation of inputs/outputs before it's sent to Trezor to not waste signing count

    const { affiliateRequest } = transaction;

    const tx = {
        inputs: transaction.inputs.map((input, index) => {
            const flags = affiliateRequest.coinjoin_flags_array[index];
            if (isInternalInput(input)) {
                return {
                    script_type: inputScriptType,
                    address_n: input.path!,
                    prev_hash: input.hash,
                    prev_index: input.index,
                    amount: input.amount,
                    coinjoin_flags: flags,
                };
            }

            return {
                address_n: undefined,
                script_type: 'EXTERNAL' as const,
                prev_hash: input.hash,
                prev_index: input.index,
                amount: input.amount,
                script_pubkey: input.scriptPubKey,
                ownership_proof: input.ownershipProof,
                commitment_data: input.commitmentData,
                coinjoin_flags: flags,
            };
        }),
        outputs: transaction.outputs.map(output => {
            if (isInternalOutput(output)) {
                return {
                    address_n: output.path! as any,
                    amount: output.amount,
                    script_type: outputScriptType,
                };
            }
            return {
                address: output.address,
                amount: output.amount,
                script_type: 'PAYTOADDRESS' as const,
            };
        }),
    };

    return {
        ...tx,
        coinjoinRequest: {
            fee_rate: affiliateRequest.fee_rate,
            no_fee_threshold: affiliateRequest.no_fee_threshold,
            min_registrable_amount: affiliateRequest.min_registrable_amount,
            mask_public_key: affiliateRequest.mask_public_key,
            signature: affiliateRequest.signature,
        },
    };
};

export const getSessionDeadlineFormat = (deadline: CoinjoinSession['sessionDeadline']) => {
    if (deadline === undefined || Number.isNaN(Number(deadline))) {
        return;
    }

    let formatToUse: Array<keyof Duration>;
    const millisecondsLeft = Number(deadline) - Date.now();

    if (millisecondsLeft >= 3600000) {
        formatToUse = ['hours'];
    } else if (millisecondsLeft >= 60000) {
        formatToUse = ['minutes'];
    } else {
        formatToUse = ['seconds'];
    }

    return formatToUse;
};

export const getPhaseTimerFormat = (deadline: CoinjoinSession['roundPhaseDeadline']) => {
    if (deadline === undefined || Number.isNaN(Number(deadline))) {
        return;
    }

    const formatToUse: Array<keyof Duration> =
        Number(deadline) - Date.now() >= 3600000 ? ['hours', 'minutes'] : ['minutes', 'seconds'];

    return formatToUse;
};

export const calculateServiceFee = (
    utxos: AccountUtxo[],
    coordinationFeeRate: CoinjoinStatusEvent['coordinationFeeRate'],
    anonymitySet: AnonymitySet,
    transactions: WalletAccountTransaction[],
) => {
    const feeInducingUtxos = utxos.filter(
        utxo =>
            new BigNumber(utxo.amount).gt(coordinationFeeRate.plebsDontPayThreshold) && // above plebsDontPayThreshold
            [1, undefined].includes(anonymitySet[utxo.address]) && // no anonymity, i.e. not previously coinjoined, or cannot determine anonymity
            transactions.find(transaction => transaction.txid === utxo.txid)?.type !== 'joint', // previous transaction is not a coinjoin (relevant when coinjoined but anonymity level remained at 1)
    );
    return feeInducingUtxos
        ?.reduce(
            (total, utxo) =>
                total.plus(
                    new BigNumber(utxo.amount)
                        .times(coordinationFeeRate.rate)
                        .integerValue(BigNumber.ROUND_FLOOR),
                ),
            new BigNumber(0),
        )
        .toString();
};

export const getIsCoinjoinOutOfSync = (selectedAccount: SelectedAccountStatus) => {
    if (selectedAccount.status !== 'loaded') return true;
    const { account } = selectedAccount;
    if (account.backendType === 'coinjoin') {
        return account.status === 'out-of-sync';
    }
};

const roundPhases = [
    RoundPhase.InputRegistration,
    RoundPhase.ConnectionConfirmation,
    RoundPhase.OutputRegistration,
    RoundPhase.TransactionSigning,
    RoundPhase.Ended,
];

export const getRoundPhaseFromSessionPhase = (sessionPhase: SessionPhase): RoundPhase =>
    roundPhases[Number(String(sessionPhase)[0]) - 1];

export const getFirstSessionPhaseFromRoundPhase = (roundPhase?: RoundPhase): SessionPhase =>
    Number(`${(roundPhase || 0) + 1}1`);

export const getAccountProgressHandle = (account: Account) =>
    createHash('sha256').update(account.key).digest('hex').slice(0, 16);
