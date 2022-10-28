import type { Alice } from '../Alice';
import type { CoinjoinPrison } from '../CoinjoinPrison';
import type { CoinjoinRound, CoinjoinRoundOptions } from '../CoinjoinRound';

const registerInput = async (
    round: CoinjoinRound,
    input: Alice,
    prison: CoinjoinPrison,
    options: CoinjoinRoundOptions,
): Promise<Alice> => {
    // TODO: process will be added in upcoming PR
    await new Promise(resolve => setTimeout(() => resolve([round, prison, options]), 2000));
    return input;
};

export const inputRegistration = async (
    round: CoinjoinRound,
    prison: CoinjoinPrison,
    options: CoinjoinRoundOptions,
) => {
    // try to register each input
    // failed inputs will be excluded from this round, successful will continue to phase: 1 (connectionConfirmation)
    options.log(`inputRegistration: ${round.id}`);

    await Promise.allSettled(
        round.inputs.map(input => registerInput(round, input, prison, options)),
    ).then(result =>
        result.forEach((r, i) => {
            if (r.status !== 'fulfilled') {
                round.inputs[i].setError(r.reason);
            }
        }),
    );

    return round;
};
