import * as coordinator from '../coordinator';
import * as middleware from '../middleware';
import { RoundPhase } from '../../types/coordinator';
import type { Alice } from '../Alice';
import type { CoinjoinRound, CoinjoinRoundOptions } from '../CoinjoinRound';

/**
 * usage in RoundPhase: 0
 * Try to confirm registered input in InputRegistration phase
 *
 * usage in RoundPhase: 1
 * Try to confirm registered input in CoinjoinRound
 * - if input doesn't have registrationData, throw error
 * - if input does have ownershipProof but it's already registered, throw error
 * - if Round phase did change before registration, abort remaining awaited registration (if any)
 */

export const confirmInput = async (
    round: CoinjoinRound,
    input: Alice,
    options: CoinjoinRoundOptions,
): Promise<Alice> => {
    if (input.error) return input;
    if (!input.registrationData || !input.realAmountCredentials || !input.realVsizeCredentials) {
        throw new Error(`Trying to confirm unregistered input ${input.outpoint}`);
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

    const delay = round.phase === RoundPhase.InputRegistration ? 0 : 0; // getRandomDelay
    log(`Confirming ${input.outpoint} to ${round.id} with delay ${delay}ms`);

    const confirmationData = await coordinator.connectionConfirmation(
        round.id,
        input.registrationData.aliceId,
        input.realAmountCredentials,
        input.realVsizeCredentials,
        zeroAmountCredentials,
        zeroVsizeCredentials,
        { signal, baseUrl: coordinatorUrl, identity: input.outpoint, delay },
    );

    // stop here if it's called from input-registration interval
    if (round.phase === RoundPhase.InputRegistration) {
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

export const connectionConfirmation = async (
    round: CoinjoinRound,
    options: CoinjoinRoundOptions,
) => {
    // try to confirm each input

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
