import { bufferutils, Transaction, Network } from '@trezor/utxo-lib';

import {
    COORDINATOR_FEE_RATE_FALLBACK,
    MAX_ALLOWED_AMOUNT_FALLBACK,
    MIN_ALLOWED_AMOUNT_FALLBACK,
    PLEBS_DONT_PAY_THRESHOLD_FALLBACK,
    ROUND_REGISTRATION_END_OFFSET,
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
    const events = getRoundEvents('RoundCreated', round.coinjoinState.events);
    if (events.length < 1) return;

    const [{ roundParameters }] = events;
    return roundParameters;
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

// NOTE: deadlines are not accurate. phase may change earlier
// accept CoinjoinRound or modified coordinator Round (see estimatePhaseDeadline below)
type PartialCoinjoinRound = {
    phase: RoundPhase;
    inputRegistrationEnd: string;
    roundParameters: CoinjoinRoundParameters;
};

export const getCoinjoinRoundDeadlines = (round: PartialCoinjoinRound) => {
    const now = Date.now();
    switch (round.phase) {
        case RoundPhase.InputRegistration: {
            const deadline =
                new Date(round.inputRegistrationEnd).getTime() + ROUND_REGISTRATION_END_OFFSET;
            return {
                phaseDeadline: deadline,
                roundDeadline:
                    deadline +
                    readTimeSpan(round.roundParameters.connectionConfirmationTimeout) +
                    readTimeSpan(round.roundParameters.outputRegistrationTimeout) +
                    readTimeSpan(round.roundParameters.transactionSigningTimeout),
            };
        }
        case RoundPhase.ConnectionConfirmation: {
            const deadline =
                now + readTimeSpan(round.roundParameters.connectionConfirmationTimeout);
            return {
                phaseDeadline: deadline,
                roundDeadline:
                    deadline +
                    readTimeSpan(round.roundParameters.outputRegistrationTimeout) +
                    readTimeSpan(round.roundParameters.transactionSigningTimeout),
            };
        }
        case RoundPhase.OutputRegistration: {
            const deadline = now + readTimeSpan(round.roundParameters.outputRegistrationTimeout);
            return {
                phaseDeadline: deadline,
                roundDeadline:
                    deadline + readTimeSpan(round.roundParameters.transactionSigningTimeout),
            };
        }
        case RoundPhase.TransactionSigning:
        case RoundPhase.Ended: {
            const deadline = now + readTimeSpan(round.roundParameters.transactionSigningTimeout);
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

    const { phaseDeadline } = getCoinjoinRoundDeadlines({ ...round, roundParameters });

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
                roundParameters?.coordinationFeeRate.plebsDontPayThreshold ??
                PLEBS_DONT_PAY_THRESHOLD_FALLBACK,
            rate: roundParameters?.coordinationFeeRate.rate ?? COORDINATOR_FEE_RATE_FALLBACK,
        },
        allowedInputAmounts: {
            max: roundParameters?.allowedInputAmounts.max ?? MAX_ALLOWED_AMOUNT_FALLBACK,
            min: roundParameters?.allowedInputAmounts.min ?? MIN_ALLOWED_AMOUNT_FALLBACK,
        },
    };
};

/**
 * Transform from coordinator format to coinjoinReducer format `CoinjoinClientInstance`
 * - coordinatorFeeRate: multiply the amount registered for coinjoin by this value to get the total fee
 * - feeRateMedian: array => value in kvBytes
 */
export const transformStatus = ({
    coinJoinFeeRateMedians,
    roundStates: rounds,
}: CoinjoinStatus) => {
    const { allowedInputAmounts, coordinationFeeRate } = getDataFromRounds(rounds);
    // coinJoinFeeRateMedians include an array of medians per day, week and month - we take the first (day) median as the recommended fee rate base.
    // The value is converted from kvBytes (kilo virtual bytes) to vBytes (how the value is displayed in UI).
    const feeRateMedian = Math.round(coinJoinFeeRateMedians[0].medianFeeRate / 1000);

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
export const sumCredentials = (c: Credentials[]) => c.reduce((sum, cre) => sum + cre.value, 0);

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
        fee_rate: roundParameters.coordinationFeeRate.rate * 10 ** 8,
        no_fee_threshold: roundParameters.coordinationFeeRate.plebsDontPayThreshold,
        min_registrable_amount: roundParameters.allowedInputAmounts.min,
        mask_public_key: mask.toString('hex'),
        signature: signature.toString('hex'),
        coinjoin_flags_array: flags,
    };
};

export const getBroadcastedTxDetails = ({
    coinjoinState: { isFullySigned, witnesses },
    transactionData,
    network,
}: {
    coinjoinState: CoinjoinState;
    network: Network;
    transactionData?: CoinjoinTransactionData;
}) => {
    if (!isFullySigned || !witnesses || !transactionData) return;

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
            witness: new BufferReader(Buffer.from(witnesses[index], 'hex')).readVector(),
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
