import * as coordinator from '../coordinator';
import * as middleware from '../middleware';
import { confirmInput } from './connectionConfirmation';
import { getRandomDelay } from '../clientUtils';
import { readTimeSpan } from '../../utils/roundUtils';
import type { Alice } from '../Alice';
import type { CoinjoinPrison } from '../CoinjoinPrison';
import type { CoinjoinRound, CoinjoinRoundOptions } from '../CoinjoinRound';

/**
 * RoundPhase: 0
 * Try to register available input in to CoinjoinRound
 * - if input doesn't have ownershipProof ask wallet to provide it
 * - if input does have ownershipProof but it's already registered, throw error
 * - if Round phase did change before registration, abort remaining awaited registration (if any)
 * - if Round inputRegistrationEnd value is greater than connectionConfirmationTimeout periodically call confirmInput ping to coordinator
 */

const confirmationInterval = (
    round: CoinjoinRound,
    input: Alice,
    options: CoinjoinRoundOptions,
) => {
    const phaseEnd = new Date(round.inputRegistrationEnd).getTime();
    // Math.floor(60000 * 0.5);
    const confirmationDeadline = Math.floor(
        readTimeSpan(round.roundParameters.connectionConfirmationTimeout) * 0.5,
    );
    let timeLeft = phaseEnd - Date.now();
    if (timeLeft < confirmationDeadline || options.signal.aborted) {
        options.log(`Ignoring confirmation interval. Deadline ${timeLeft}`);
        return input;
    }

    options.log(`Setting confirmation interval. Deadline ${timeLeft}ms`);

    return new Promise<Alice>(resolve => {
        let timeout: ReturnType<typeof setTimeout>;
        const timeoutFn = async () => {
            try {
                await confirmInput(round, input, options);
                timeLeft = phaseEnd - Date.now();
                options.log(
                    `Confirmation interval. Deadline ${timeLeft}ms. ${round.id} ${
                        input.registrationData!.aliceId
                    }`,
                );
                if (timeLeft > confirmationDeadline) {
                    timeout = setTimeout(timeoutFn, confirmationDeadline);
                } else {
                    // Alice deadline should be ok now
                    resolve(input);
                }
            } catch (error) {
                options.log(`Confirmation interval with error ${error.message}`);
                // do nothing, it will be processed in next phase
                resolve(input);
            }
        };

        timeout = setTimeout(timeoutFn, confirmationDeadline);

        options.signal.addEventListener('abort', () => {
            options.log(`Confirmation interval aborted`);
            clearTimeout(timeout);
            resolve(input);
        });
    });
};

const registerInput = async (
    round: CoinjoinRound,
    input: Alice,
    prison: CoinjoinPrison,
    options: CoinjoinRoundOptions,
): Promise<Alice> => {
    if (input.error) {
        options.log(`Trying to register input with error ${input.error}`);
        return input;
    }
    // stop here and request for ownership proof from the wallet
    if (!input.ownershipProof) {
        options.log(`waiting for ownership proof ${input.outpoint}`);
        return input;
    }

    if (input.registrationData) {
        options.log(`Input ${input.outpoint} already registered. Skipping.`);
        return input;
    }

    const { signal, coordinatorUrl, middlewareUrl } = options;

    const zeroAmountCredentials = await middleware.getZeroCredentials(
        round.amountCredentialIssuerParameters,
        { signal, baseUrl: middlewareUrl },
    );
    const zeroVsizeCredentials = await middleware.getZeroCredentials(
        round.vsizeCredentialIssuerParameters,
        { signal, baseUrl: middlewareUrl },
    );

    const delay = getRandomDelay(1, 1000 * 10);
    options.log(`Trying to register ${input.outpoint} to ${round.id} with delay ${delay}ms`);

    const registrationData = await coordinator
        .inputRegistration(
            round.id,
            input.outpoint,
            input.ownershipProof,
            zeroAmountCredentials,
            zeroVsizeCredentials,
            {
                signal,
                baseUrl: coordinatorUrl,
                identity: input.outpoint,
                delay,
            },
        )
        .catch(error => {
            options.log(`Registration ${input.outpoint} to ${round.id} failed: ${error.message}`);
            if (error.message === 'WrongPhase') {
                // abort remaining candidates to register (if exists) it's not going to happen anyway
                signal.dispatchEvent(new Event('abort'));
            }
            throw error;
        });

    input.setRegistrationData(registrationData);
    prison.ban(input.outpoint, { roundId: round.id, reason: 'TodoAlreadyRegistered' });

    // NOTE: registration data processing is intentionally not using abort signal
    // should not be aborted if round.phase was changed immediately (triggered by Status change)
    try {
        const amountCredentials = await middleware.getCredentials(
            round.amountCredentialIssuerParameters,
            registrationData.amountCredentials,
            zeroAmountCredentials.credentialsResponseValidation,
            { baseUrl: middlewareUrl }, // NOTE: post processing intentionally without abort signal (should not be aborted)
        );
        const vsizeCredentials = await middleware.getCredentials(
            round.vsizeCredentialIssuerParameters,
            registrationData.vsizeCredentials,
            zeroVsizeCredentials.credentialsResponseValidation,
            { baseUrl: middlewareUrl }, // NOTE: post processing intentionally without abort signal (should not be aborted)
        );

        const { roundParameters } = round;

        const coordinatorFee =
            input.amount > roundParameters.coordinationFeeRate.plebsDontPayThreshold &&
            !registrationData.isPayingZeroCoordinationFee
                ? Math.floor(roundParameters.coordinationFeeRate.rate * input.amount)
                : 0;

        const miningFee = Math.floor((input.inputSize * roundParameters.miningFeeRate) / 1000);
        const amount = input.amount - coordinatorFee - miningFee;
        const vsize = roundParameters.maxVsizeAllocationPerAlice - input.inputSize;

        const realAmountCredentials = await middleware.getRealCredentials(
            [amount, 0],
            amountCredentials,
            round.amountCredentialIssuerParameters,
            roundParameters.maxAmountCredentialValue,
            { baseUrl: middlewareUrl },
        );
        const realVsizeCredentials = await middleware.getRealCredentials(
            [vsize, 0],
            vsizeCredentials,
            round.vsizeCredentialIssuerParameters,
            roundParameters.maxVsizeCredentialValue,
            { baseUrl: middlewareUrl },
        );

        options.log(
            `Registration ${input.outpoint} to ${round.id} successful. aliceId: ${registrationData.aliceId}`,
        );
        options.log(
            `${input.outpoint} will pay ${coordinatorFee} coordinator fee and ${miningFee} mining fee`,
        );

        input.setRealCredentials(realAmountCredentials, realVsizeCredentials);

        // Input registration process requires to call /connection-confirmation
        // in intervals less than connectionConfirmationTimeout * 0.9 to prevent AliceTimeout on coordinator
        return confirmationInterval(round, input, options);
    } catch (error) {
        // TODO: try to unregister if post processing fails
        // await coordinator.inputUnregistration(round.id, registrationData.aliceId, {
        //     // signal,
        //     baseUrl: coordinatorUrl,
        //     identity: input.outpoint,
        // });

        input.setError(error);
        return input;
    }
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
