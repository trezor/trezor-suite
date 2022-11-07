import * as coordinator from '../coordinator';
import * as middleware from '../middleware';
import { readTimeSpan } from '../../utils/roundUtils';
import type { Alice } from '../Alice';
import type { CoinjoinRound, CoinjoinRoundOptions } from '../CoinjoinRound';

/**
 * usage in RoundPhase: 0, InputRegistration
 * Try to confirm registered input in InputRegistration phase
 *
 * usage in RoundPhase: 1, ConnectionConfirmation
 * Try to confirm registered input in CoinjoinRound
 * - if input doesn't have registrationData, throw error
 * - if input does have ownershipProof but it's already registered, throw error
 * - if Round phase did change before registration, abort remaining awaited registration (if any)
 */

const confirmInput = async (
    round: CoinjoinRound,
    input: Alice,
    options: CoinjoinRoundOptions,
): Promise<Alice> => {
    if (input.error) {
        options.log(`Trying to confirm input with error ${input.error}`);
        throw input.error;
    }
    if (!input.registrationData || !input.realAmountCredentials || !input.realVsizeCredentials) {
        throw new Error(`Trying to confirm unregistered input ~~${input.outpoint}~~`);
    }
    if (input.confirmationData) {
        options.log(`Input ~~${input.outpoint}~~ already confirmed. Skipping.`);
        return input;
    }

    const { signal, coordinatorUrl, middlewareUrl, log } = options;

    const zeroAmountCredentials = await middleware.getZeroCredentials(
        round.amountCredentialIssuerParameters,
        { signal, baseUrl: middlewareUrl },
    );
    const zeroVsizeCredentials = await middleware.getZeroCredentials(
        round.vsizeCredentialIssuerParameters,
        { signal, baseUrl: middlewareUrl },
    );

    const delay = 0; // TODO: delay cannot be longer than last confirmationInterval tick
    log(`Confirming ~~${input.outpoint}~~ to ~~${round.id}~~ with delay ${delay}ms`);

    const confirmationData = await coordinator.connectionConfirmation(
        round.id,
        input.registrationData.aliceId,
        input.realAmountCredentials,
        input.realVsizeCredentials,
        zeroAmountCredentials,
        zeroVsizeCredentials,
        { signal, baseUrl: coordinatorUrl, identity: input.outpoint, delay },
    );

    // stop here if it's confirmationInterval at phase 0
    if (round.phase === coordinator.RoundPhase.InputRegistration) {
        return input;
    }

    const confirmedAmountCredentials = await middleware.getCredentials(
        round.amountCredentialIssuerParameters,
        confirmationData.realAmountCredentials,
        input.realAmountCredentials.credentialsResponseValidation,
        { baseUrl: middlewareUrl }, // NOTE: post processing intentionally without abort signal (should not be aborted)
    );
    const confirmedVsizeCredentials = await middleware.getCredentials(
        round.vsizeCredentialIssuerParameters,
        confirmationData.realVsizeCredentials,
        input.realVsizeCredentials.credentialsResponseValidation,
        { baseUrl: middlewareUrl }, // NOTE: post processing intentionally without abort signal (should not be aborted)
    );

    log(`Confirmed ${input.outpoint} in ${round.id}`);

    input.setConfirmationData(confirmationData);
    input.setConfirmedCredentials(confirmedAmountCredentials, confirmedVsizeCredentials);

    return input;
};

// Because of the nature of coordinator registration process requires (after successfully registration)
// to call `/connection-confirmation` in intervals less than connectionConfirmationTimeout * 0.9 to prevent AliceTimeout error on coordinator
export const confirmationInterval = (
    round: CoinjoinRound,
    input: Alice,
    options: CoinjoinRoundOptions,
) => {
    const { phaseDeadline } = round;
    const timeoutDeadline = Math.floor(
        readTimeSpan(round.roundParameters.connectionConfirmationTimeout) * 0.5, // TODO: constant
    );
    let timeLeft = phaseDeadline - Date.now();
    if (timeLeft < timeoutDeadline || options.signal.aborted) {
        options.log(
            `Ignoring confirmation interval for ~~${input.outpoint}~~. Deadline ${timeLeft}`,
        );
        return input;
    }

    options.log(`Setting confirmation interval for ~~${input.outpoint}~~. Deadline ${timeLeft}ms`);

    return new Promise<Alice>(resolve => {
        let timeout: ReturnType<typeof setTimeout>;

        const done = () => {
            options.log(`Confirmation interval for ~~${input.outpoint}~~ completed`);
            options.signal.removeEventListener('abort', done);
            clearTimeout(timeout);
            resolve(input);
        };

        const timeoutFn = async () => {
            try {
                await confirmInput(round, input, options);
                timeLeft = phaseDeadline - Date.now();
                options.log(
                    `Confirmation interval for ~~${input.outpoint}~~. Time left ${timeLeft}ms.`,
                );
                if (timeLeft > timeoutDeadline) {
                    timeout = setTimeout(timeoutFn, timeoutDeadline);
                } else {
                    // Alice timeout should be ok now
                    done();
                }
            } catch (error) {
                options.log(`Confirmation interval with error ${error.message}`);
                // do nothing. it will be processed by next phase in CoinjoinRound.processPhase
                done();
            }
        };

        timeout = setTimeout(timeoutFn, timeoutDeadline);

        options.signal.addEventListener('abort', done);
    });
};

export const connectionConfirmation = async (
    round: CoinjoinRound,
    options: CoinjoinRoundOptions,
) => {
    // try to confirm each input
    // failed inputs will be excluded from this round, successful will continue to phase: 2 (outputRegistration)
    options.log(`connectionConfirmation: ~~${round.id}~~`);

    await Promise.allSettled(round.inputs.map(input => confirmInput(round, input, options))).then(
        result =>
            result.forEach((r, i) => {
                if (r.status !== 'fulfilled') {
                    round.inputs[i].setError(r.reason);
                }
            }),
    );

    return round;
};
