import BigNumber from 'bignumber.js';
import { createHash } from 'crypto';
import hoursToMilliseconds from 'date-fns/hoursToMilliseconds';

import { getUtxoOutpoint, getBip43Type } from '@suite-common/wallet-utils';
import { Account, SelectedAccountStatus } from '@suite-common/wallet-types';
import {
    ANONYMITY_GAINS_HINDSIGHT_COUNT,
    ANONYMITY_GAINS_HINDSIGHT_DAYS,
    MAX_ROUNDS_ALLOWED,
    ESTIMATED_MIN_ROUNDS_NEEDED,
    SKIP_ROUNDS_VALUE_WHEN_ENABLED,
} from 'src/services/coinjoin/config';
import {
    AnonymityGainPerRound,
    CoinjoinAccount,
    CoinjoinSessionParameters,
} from 'src/types/wallet/coinjoin';
import { AnonymitySet } from '@trezor/blockchain-link';
import {
    CoinjoinStatusEvent,
    RegisterAccountParams,
    CoinjoinTransactionData,
    SessionPhase,
    RoundPhase,
} from '@trezor/coinjoin';

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

export const transformCoinjoinStatus = ({
    coordinationFeeRate,
    feeRateMedian,
    allowedInputAmounts,
    rounds,
}: CoinjoinStatusEvent) => ({
    coordinationFeeRate,
    feeRateMedian,
    allowedInputAmounts,
    rounds: rounds.map(({ Id: id, Phase: phase }) => ({ id, phase })),
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
const getCoinjoinAccountUtxos = (
    utxos: Account['utxo'],
    anonymitySet: AnonymitySet | undefined = {},
) =>
    utxos
        ?.filter(utxo => utxo.confirmations)
        .map(utxo => ({
            path: utxo.path,
            outpoint: getUtxoOutpoint(utxo),
            address: utxo.address,
            amount: Number(utxo.amount),
            anonymityLevel: anonymitySet[utxo.address],
        })) || [];

// select only addresses without tx history
const getCoinjoinAccountAddresses = (addresses: Account['addresses']) =>
    addresses?.change?.filter(a => !a.transfers) || [];

type GetRegisterAccountParamsOptions = { session: CoinjoinSessionParameters } & Pick<
    CoinjoinAccount,
    'rawLiquidityClue'
>;

/**
 * Transform from suite Account to @trezor/coinjoin RegisterAccountParams
 */
export const getRegisterAccountParams = (
    account: Account,
    { rawLiquidityClue, session }: GetRegisterAccountParamsOptions,
): RegisterAccountParams => ({
    scriptType: getCoinjoinAccountScriptType(account.path),
    accountKey: account.key,
    targetAnonymity: session.targetAnonymity,
    rawLiquidityClue,
    maxRounds: session.maxRounds,
    skipRounds: session.skipRounds,
    maxFeePerKvbyte: session.maxFeePerKvbyte,
    maxCoordinatorFeeRate: session.maxCoordinatorFeeRate,
    utxos: getCoinjoinAccountUtxos(account.utxo, account.addresses?.anonymitySet),
    changeAddresses: getCoinjoinAccountAddresses(account.addresses),
});

const getSkipRoundsRate = (skipRounds?: [number, number]) =>
    skipRounds ? skipRounds[1] / skipRounds[0] : 1;

// calculate max rounds to allow on device from estimated rounds needed
export const getMaxRounds = (roundsNeeded: number, roundsFailRateBuffer: number) => {
    const estimatedRoundsCount = Math.ceil(roundsNeeded * roundsFailRateBuffer);

    return Math.min(
        Math.max(estimatedRoundsCount, ESTIMATED_MIN_ROUNDS_NEEDED),
        MAX_ROUNDS_ALLOWED,
    );
};

// transform boolean to skip rounds value used by @trezor/coinjoin
export const getSkipRounds = (enabled: boolean) =>
    enabled ? SKIP_ROUNDS_VALUE_WHEN_ENABLED : undefined;

export const getMaxFeePerVbyte = (feeRateMedian: number, maxMiningFeeModifier: number) =>
    Math.round(feeRateMedian * maxMiningFeeModifier);

// get time estimate in millisecond per round
export const getEstimatedTimePerRound = (
    roundsDurationInHours: number,
    skipRounds?: [number, number],
) => hoursToMilliseconds(roundsDurationInHours) * getSkipRoundsRate(skipRounds);

export const getSessionDeadline = ({
    currentTimestamp,
    roundDeadline,
    timePerRound,
    roundsLeft,
    roundsNeeded,
}: {
    currentTimestamp: number;
    roundDeadline: number;
    timePerRound: number;
    roundsLeft: number;
    roundsNeeded: number;
}) => {
    const timeLeftTillRoundEnd = Math.max(roundDeadline - currentTimestamp, 0);

    const sessionDeadlineRaw = currentTimestamp + Math.min(roundsNeeded, roundsLeft) * timePerRound;

    return sessionDeadlineRaw + timeLeftTillRoundEnd;
};

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
                } as const;
            }

            return {
                address_n: undefined,
                script_type: 'EXTERNAL',
                prev_hash: input.hash,
                prev_index: input.index,
                amount: input.amount,
                script_pubkey: input.scriptPubKey,
                ownership_proof: input.ownershipProof,
                commitment_data: input.commitmentData,
                coinjoin_flags: flags,
            } as const;
        }),
        outputs: transaction.outputs.map(output => {
            if (isInternalOutput(output)) {
                return {
                    address_n: output.path!,
                    amount: output.amount,
                    script_type: outputScriptType,
                } as const;
            }

            return {
                address: output.address,
                amount: output.amount,
                script_type: 'PAYTOADDRESS',
            } as const;
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

export const getIsCoinjoinOutOfSync = (selectedAccount: SelectedAccountStatus) => {
    if (selectedAccount.status !== 'loaded') return true;
    const { account } = selectedAccount;
    if (account.backendType === 'coinjoin') {
        return account.status === 'out-of-sync';
    }
};

export const getRoundPhaseFromSessionPhase = (sessionPhase: SessionPhase) => {
    const isValidRoundPhase = (result: number): result is RoundPhase =>
        Object.values(RoundPhase).some(value => value === result);

    const result = Number(String(sessionPhase)[0]) - 1;

    if (!isValidRoundPhase(result)) {
        throw new Error(`Invalid round phase value: ${result}`);
    }

    return result;
};

export const getFirstSessionPhaseFromRoundPhase = (roundPhase?: RoundPhase) => {
    const isValidSessionPhase = (result: number): result is SessionPhase =>
        Object.values(SessionPhase).some(value => value === result);

    const result = Number(`${(roundPhase || 0) + 1}01`);

    if (!isValidSessionPhase(result)) {
        throw new Error(`Invalid session phase value: ${result}`);
    }

    return result;
};

export const getAccountProgressHandle = (account: Pick<Account, 'key'>) =>
    createHash('sha256').update(account.key).digest('hex').slice(0, 16);

export const fixLoadedCoinjoinAccount = ({
    status,
    ...account
}: Extract<Account, { backendType: 'coinjoin' }>): Extract<
    Account,
    { backendType: 'coinjoin' }
> => {
    let statusFixed;

    // If account had been successfully discovered before stored, it should be out-of-sync after loading
    if (status === 'ready') statusFixed = 'out-of-sync' as const;
    // If account was in error state (= never successfully discovered before), we could fall back to initial
    else if (status === 'error') statusFixed = 'initial' as const;
    else statusFixed = status;

    return {
        ...account,
        status: statusFixed,
        syncing: undefined, // If account was syncing when stored, we have to remove the flag
    };
};

// Clean AnonymityGains from old records.
export const cleanAnonymityGains = (anonymityGainsHistory: AnonymityGainPerRound[]) => {
    const oldestRelevantTimestamp =
        new Date().getTime() - ANONYMITY_GAINS_HINDSIGHT_DAYS * 24 * 60 * 60 * 1000;

    return anonymityGainsHistory
        .filter(level => level.timestamp > oldestRelevantTimestamp)
        .slice(0, ANONYMITY_GAINS_HINDSIGHT_COUNT);
};

// Calculate average anonymity gain per round to estimate rounds needed.
export const calculateAverageAnonymityGainPerRound = (
    defaultAnonymityGain: number,
    anonymityGainsHistory?: AnonymityGainPerRound[],
) => {
    // If there is no recorded history, return default.
    if (!anonymityGainsHistory?.length) {
        return defaultAnonymityGain;
    }

    // If there are less than ANONYMITY_GAINS_HINDSIGHT_COUNT records, supplement the remaining values by defaultAnonymityGainPerRound to reduce deviation.
    const anonymityGains = cleanAnonymityGains(anonymityGainsHistory);
    const anonymityLevels = anonymityGains.map(level => level.level);
    const supplementedAnonymityLevels =
        anonymityLevels.length < ANONYMITY_GAINS_HINDSIGHT_COUNT
            ? anonymityLevels.concat(
                  new Array(ANONYMITY_GAINS_HINDSIGHT_COUNT - anonymityGains.length).fill(
                      defaultAnonymityGain,
                  ),
              )
            : anonymityLevels;

    // Calculate average.
    return (
        supplementedAnonymityLevels.reduce((total, current) => total + current, 0) /
        ANONYMITY_GAINS_HINDSIGHT_COUNT
    );
};
