import { ROUND_REGISTRATION_END_OFFSET } from '../constants';
import {
    RoundPhase,
    Round,
    CoinjoinStateEvent,
    CoinjoinRoundParameters,
} from '../types/coordinator';

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
        case RoundPhase.TransactionSigning: {
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
    const deadlines = rounds
        .map(r => estimatePhaseDeadline(r))
        .filter(r => r) // skip 0/undefined
        .map(r => new Date(r).getTime() - now);

    return Math.min(...deadlines);
};

// iterate Status and find coordinationFeeRate
export const getCoordinatorFeeRate = (rounds: Round[]) => {
    const rates = rounds.map(round => {
        const roundParameters = getRoundParameters(round);
        if (!roundParameters) return 0.003;

        return roundParameters.coordinationFeeRate.rate;
    });

    return Math.max(...rates);
};
