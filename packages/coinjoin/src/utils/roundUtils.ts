import { bufferutils, Transaction, Network } from '@trezor/utxo-lib';
import { getRandomNumberInRange } from '@trezor/utils';

import {
    COORDINATOR_FEE_RATE_FALLBACK,
    MAX_ALLOWED_AMOUNT_FALLBACK,
    MIN_ALLOWED_AMOUNT_FALLBACK,
    PLEBS_DONT_PAY_THRESHOLD_FALLBACK,
    ROUND_REGISTRATION_END_OFFSET,
    ROUND_MAXIMUM_REQUEST_DELAY,
} from '../constants';
import { RoundPhase } from '../enums';
import { CoinjoinTransactionData } from '../types';
import {
    Round,
    CoinjoinStateEvent,
    CoinjoinRoundParameters,
    CoinjoinAffiliateRequest,
    CoinjoinStatus,
    CoinjoinState,
} from '../types/coordinator';
import { Credentials } from '../types/middleware';

export const getRoundEvents = <T extends CoinjoinStateEvent['Type']>(
    type: T,
    events: CoinjoinStateEvent[],
) => events.filter(e => e.Type === type) as Extract<CoinjoinStateEvent, { Type: T }>[];

export const getRoundParameters = (round: Round) => {
    const events = getRoundEvents('RoundCreated', round.CoinjoinState.Events);
    if (events.length < 1) return;

    const [{ RoundParameters }] = events;

    return RoundParameters;
};

// round commitmentData used in request for input ownershipProof
export const getCommitmentData = (identifier: string, roundId: string) => {
    const name = Buffer.from(identifier);
    const len = Buffer.allocUnsafe(1);
    len.writeUInt8(name.length, 0);

    return Buffer.concat([len, name, Buffer.from(roundId, 'hex')]).toString('hex');
};

// transform '0d 0h 1m 0s' (WabiSabi TimeSpan) to milliseconds
export const readTimeSpan = (ts: string) => {
    const span = ts.split(' ').map(v => parseInt(v, 10));

    const date = new Date();
    const now = date.getTime();
    const [days, hours, minutes, seconds] = span;

    if (days > 0) {
        date.setDate(date.getDate() + days);
    }

    if (hours > 0) {
        date.setHours(date.getHours() + hours);
    }

    if (minutes > 0) {
        date.setMinutes(date.getMinutes() + minutes);
    }

    if (seconds > 0) {
        date.setSeconds(date.getSeconds() + seconds);
    }

    return date.getTime() - now;
};

const clamp = (value: number, min = Number.NEGATIVE_INFINITY, max = Number.POSITIVE_INFINITY) =>
    Math.min(Math.max(value, min), max);

export const scheduleDelay = (
    deadline: number,
    minimumDelay = 0,
    maximumDelay = ROUND_MAXIMUM_REQUEST_DELAY,
) => {
    // reduce deadline to have absolute minimum time to make the actual request (10 seconds),
    // but it must be at least 1 sec
    const deadlineOffset = clamp(deadline - ROUND_MAXIMUM_REQUEST_DELAY, 1000);
    // clamp the given maximum delay so it's at least 1 sec (so there's always room for randomness)
    // and at most the calculated offset (so we meet the deadline)
    const max = clamp(maximumDelay, 1000, deadlineOffset);
    // clamp the given minimum delay so it's at least immediate (no negative delays)
    // and at most 1 sec before the calculated max (so there's room for randomness)
    const min = clamp(minimumDelay, 0, max - 1000);

    return getRandomNumberInRange(min, max);
};

// NOTE: deadlines are not accurate. phase may change earlier
// accept CoinjoinRound or modified coordinator Round (see estimatePhaseDeadline below)
type PartialCoinjoinRound = {
    Phase: RoundPhase;
    InputRegistrationEnd: string;
    RoundParameters: CoinjoinRoundParameters;
};

export const getCoinjoinRoundDeadlines = (round: PartialCoinjoinRound) => {
    const now = Date.now();
    switch (round.Phase) {
        case RoundPhase.InputRegistration: {
            const deadline =
                new Date(round.InputRegistrationEnd).getTime() + ROUND_REGISTRATION_END_OFFSET;

            return {
                phaseDeadline: deadline,
                roundDeadline:
                    deadline +
                    readTimeSpan(round.RoundParameters.ConnectionConfirmationTimeout) +
                    readTimeSpan(round.RoundParameters.OutputRegistrationTimeout) +
                    readTimeSpan(round.RoundParameters.TransactionSigningTimeout),
            };
        }
        case RoundPhase.ConnectionConfirmation: {
            const deadline =
                now + readTimeSpan(round.RoundParameters.ConnectionConfirmationTimeout);

            return {
                phaseDeadline: deadline,
                roundDeadline:
                    deadline +
                    readTimeSpan(round.RoundParameters.OutputRegistrationTimeout) +
                    readTimeSpan(round.RoundParameters.TransactionSigningTimeout),
            };
        }
        case RoundPhase.OutputRegistration: {
            const deadline = now + readTimeSpan(round.RoundParameters.OutputRegistrationTimeout);

            return {
                phaseDeadline: deadline,
                roundDeadline:
                    deadline + readTimeSpan(round.RoundParameters.TransactionSigningTimeout),
            };
        }
        case RoundPhase.TransactionSigning:
        case RoundPhase.Ended: {
            const deadline = now + readTimeSpan(round.RoundParameters.TransactionSigningTimeout);

            return {
                phaseDeadline: deadline,
                roundDeadline: deadline,
            };
        }
        default:
            return {
                phaseDeadline: now,
                roundDeadline: now,
            };
    }
};

export const estimatePhaseDeadline = (round: Round) => {
    const roundParameters = getRoundParameters(round);
    if (!roundParameters) return 0;

    const { phaseDeadline } = getCoinjoinRoundDeadlines({
        ...round,
        RoundParameters: roundParameters,
    });

    return phaseDeadline;
};

export const findNearestDeadline = (rounds: Round[]) => {
    const now = Date.now();
    const deadlines = rounds.map(r => {
        const phaseDeadline = estimatePhaseDeadline(r);
        const timeLeft = phaseDeadline ? new Date(phaseDeadline).getTime() - now : 0;

        return timeLeft > 0 ? timeLeft : now;
    });

    return Math.min(...deadlines);
};

// get relevant round data from the most recent round
const getDataFromRounds = (rounds: Round[]) => {
    const lastRound = rounds.at(-1);
    const roundParameters = lastRound && getRoundParameters(lastRound);

    return {
        coordinationFeeRate: {
            plebsDontPayThreshold:
                roundParameters?.CoordinationFeeRate.PlebsDontPayThreshold ??
                PLEBS_DONT_PAY_THRESHOLD_FALLBACK,
            rate: roundParameters?.CoordinationFeeRate.Rate ?? COORDINATOR_FEE_RATE_FALLBACK,
        },
        allowedInputAmounts: {
            max: roundParameters?.AllowedInputAmounts.Max ?? MAX_ALLOWED_AMOUNT_FALLBACK,
            min: roundParameters?.AllowedInputAmounts.Min ?? MIN_ALLOWED_AMOUNT_FALLBACK,
        },
    };
};

/**
 * Transform from coordinator format to coinjoinReducer format `CoinjoinClientInstance`
 * - coordinatorFeeRate: multiply the amount registered for coinjoin by this value to get the total fee
 * - feeRateMedian: array => value in kvBytes
 */
export const transformStatus = ({
    CoinJoinFeeRateMedians,
    RoundStates: rounds,
}: CoinjoinStatus) => {
    const { allowedInputAmounts, coordinationFeeRate } = getDataFromRounds(rounds);
    // coinJoinFeeRateMedians include an array of medians per day, week and month - we take the first (day) median as the recommended fee rate base.
    // The value is converted from kvBytes (kilo virtual bytes) to vBytes (how the value is displayed in UI).
    const feeRateMedian = Math.round(CoinJoinFeeRateMedians[0].MedianFeeRate / 1000);

    return {
        rounds,
        feeRateMedian,
        coordinationFeeRate,
        allowedInputAmounts,
    };
};

export const compareOutpoint = (a: string, b: string) =>
    Buffer.from(a, 'hex').compare(Buffer.from(b, 'hex')) === 0;

// sum input Credentials
export const sumCredentials = (c: Credentials[]) => c.reduce((sum, cre) => sum + cre.Value, 0);

export const getAffiliateRequest = (
    roundParameters: CoinjoinRoundParameters,
    base64data?: string,
): CoinjoinAffiliateRequest => {
    if (!base64data) {
        throw new Error('Missing affiliate request data');
    }

    const reader = new bufferutils.BufferReader(Buffer.from(base64data, 'base64'));
    // read first 33 bytes of mask_public_key
    const mask = reader.readSlice(33);
    // read 64 bytes of signature
    const signature = reader.readSlice(64);
    // read left overs, each byte = one element of coinjoin_flags_array
    const flags: number[] = [];
    while (reader.offset < reader.buffer.length) {
        flags.push(reader.readUInt8());
    }

    return {
        fee_rate: roundParameters.CoordinationFeeRate.Rate * 10 ** 8,
        no_fee_threshold: roundParameters.CoordinationFeeRate.PlebsDontPayThreshold,
        min_registrable_amount: roundParameters.AllowedInputAmounts.Min,
        mask_public_key: mask.toString('hex'),
        signature: signature.toString('hex'),
        coinjoin_flags_array: flags,
    };
};

export const getBroadcastedTxDetails = ({
    coinjoinState: { IsFullySigned, Witnesses },
    transactionData,
    network,
}: {
    coinjoinState: CoinjoinState;
    network: Network;
    transactionData?: CoinjoinTransactionData;
}) => {
    if (!IsFullySigned || !Witnesses || !transactionData) return;

    const { reverseBuffer, BufferReader } = bufferutils;
    const tx = new Transaction({ network });

    // constants assigned by coordinator
    tx.version = 1;
    tx.locktime = 0;
    const sequence = 4294967295;

    transactionData.inputs.forEach((input, index) => {
        tx.ins.push({
            hash: reverseBuffer(Buffer.from(input.hash, 'hex')),
            index: input.index,
            script: Buffer.allocUnsafe(0), // script is not used in calculation
            sequence,
            witness: new BufferReader(Buffer.from(Witnesses[index], 'hex')).readVector(),
        });
    });

    transactionData.outputs.forEach(output => {
        tx.outs.push({
            value: output.amount.toString(),
            script: Buffer.from(output.scriptPubKey, 'hex'),
        });
    });

    return {
        ...transactionData,
        hex: tx.toHex(),
        hash: tx.getHash().toString('hex'),
        txid: tx.getId(),
        size: tx.weight(),
        vsize: tx.virtualSize(),
    };
};
