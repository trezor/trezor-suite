import { RoundPhase, Round, CoinjoinStateEvent } from '../types/coordinator';

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

// NOTE: deadline is not accurate. phase may change earlier
export const estimatePhaseDeadline = (round: Round) => {
    const deadline = new Date(round.inputRegistrationEnd).getTime();

    if (round.phase === RoundPhase.InputRegistration) {
        return deadline;
    }

    const roundParameters = getRoundParameters(round);
    if (!roundParameters) return 0;

    if (round.phase === RoundPhase.ConnectionConfirmation) {
        return deadline + readTimeSpan(roundParameters.connectionConfirmationTimeout);
    }

    if (round.phase === RoundPhase.OutputRegistration) {
        return (
            deadline +
            readTimeSpan(roundParameters.connectionConfirmationTimeout) +
            readTimeSpan(roundParameters.outputRegistrationTimeout)
        );
    }

    if (round.phase === RoundPhase.TransactionSigning) {
        return (
            deadline +
            readTimeSpan(roundParameters.connectionConfirmationTimeout) +
            readTimeSpan(roundParameters.outputRegistrationTimeout) +
            readTimeSpan(roundParameters.transactionSigningTimeout)
        );
    }

    return 0;
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
