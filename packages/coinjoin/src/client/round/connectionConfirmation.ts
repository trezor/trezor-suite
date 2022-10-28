import type { CoinjoinRound, CoinjoinRoundOptions } from '../CoinjoinRound';

export const connectionConfirmation = async (
    round: CoinjoinRound,
    options: CoinjoinRoundOptions,
) => {
    options.log(`connectionConfirmation: ${round.id}`);

    await Promise.allSettled(
        round.inputs.map(
            input => new Promise(resolve => setTimeout(() => resolve([input, options]), 2000)),
        ),
    ).then(result =>
        result.forEach((r, i) => {
            if (r.status !== 'fulfilled') {
                round.inputs[i].setError(r.reason);
            }
        }),
    );

    return round;
};
