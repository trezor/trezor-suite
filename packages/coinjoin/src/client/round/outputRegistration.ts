import type { Account } from '../Account';
import type { CoinjoinPrison } from '../CoinjoinPrison';
import type { CoinjoinRound, CoinjoinRoundOptions } from '../CoinjoinRound';

export const outputRegistration = async (
    round: CoinjoinRound,
    accounts: Account[],
    prison: CoinjoinPrison,
    options: CoinjoinRoundOptions,
) => {
    options.log(`outputRegistration: ${round.id}`);

    await Promise.allSettled(
        round.inputs.map(
            input =>
                new Promise(resolve =>
                    setTimeout(() => resolve([input, accounts, prison, options]), 2000),
                ),
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
