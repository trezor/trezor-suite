import { getRandomNumberInRange } from '@trezor/utils';

import * as coordinator from '../coordinator';
import * as middleware from '../middleware';
import { confirmationInterval } from './connectionConfirmation';
import { ROUND_SELECTION_REGISTRATION_OFFSET } from '../../constants';
import type { Alice } from '../Alice';
import type { CoinjoinRound, CoinjoinRoundOptions } from '../CoinjoinRound';
import { SessionPhase } from '../../enums';

/**
 * RoundPhase: 0, InputRegistration
 *
 * Try to register available input in to CoinjoinRound
 * - if input doesn't have ownershipProof ask wallet to provide it
 * - if input does have ownershipProof but it's already registered, throw error
 * - if Round phase did change before registration, abort remaining awaited registration (if any)
 * - if Round inputRegistrationEnd value is greater than connectionConfirmationTimeout periodically call confirmInput ping to coordinator
 */

const registerInput = async (
    round: CoinjoinRound,
    input: Alice,
    options: CoinjoinRoundOptions,
): Promise<Alice> => {
    const { logger } = options;
    if (input.error) {
        logger.warn(`Trying to register input with error ${input.error}`);
        throw input.error;
    }
    // stop here and request for ownership proof from the wallet
    if (!input.ownershipProof) {
        logger.log(`Waiting for ~~${input.outpoint}~~ ownership proof`);
        return input;
    }

    if (input.registrationData) {
        logger.log(`Input ~~${input.outpoint}~~ already registered. Skipping.`);
        return input;
    }

    const { signal, coordinatorUrl, middlewareUrl } = options;

    // request ZeroCredentials from the middleware. use them in coordinator.inputRegistration
    const zeroAmountCredentials = await middleware.getZeroCredentials(
        round.amountCredentialIssuerParameters,
        { signal, baseUrl: middlewareUrl },
    );
    const zeroVsizeCredentials = await middleware.getZeroCredentials(
        round.vsizeCredentialIssuerParameters,
        { signal, baseUrl: middlewareUrl },
    );

    // setup random delay for registration request. we want each input to be registered in different time as different TOR identity
    // note that this may cause that the input will not be registered if phase change before expected deadline
    const deadline = round.phaseDeadline - Date.now() - ROUND_SELECTION_REGISTRATION_OFFSET;
    const delay = deadline > 0 ? getRandomNumberInRange(0, deadline) : 0;
    logger.log(
        `Trying to register ~~${input.outpoint}~~ to ~~${round.id}~~ with delay ${delay}ms and deadline ${round.phaseDeadline}`,
    );

    // register input in coordinator
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
                deadline: round.phaseDeadline,
            },
        )
        .catch(error => {
            logger.warn(
                `Registration ~~${input.outpoint}~~ to ~~${round.id}~~ failed: ${error.message}`,
            );
            // catch specific error
            if (error.message === coordinator.WabiSabiProtocolErrorCode.WrongPhase) {
                // abort remaining delayed candidates to register (if exists) registration is not going to happen for them anyway
                signal.dispatchEvent(new Event('abort'));
            }
            throw error;
        });

    // Calculate mining and coordinator fee
    // coordinator fee is 0 if input is remixed or amount is lower than or equal to plebsDontPayThreshold value
    const { roundParameters } = round;
    const coordinatorFee =
        input.amount > roundParameters.coordinationFeeRate.plebsDontPayThreshold &&
        !registrationData.isPayingZeroCoordinationFee
            ? Math.floor(roundParameters.coordinationFeeRate.rate * input.amount)
            : 0;
    const miningFee = Math.floor((input.inputSize * roundParameters.miningFeeRate) / 1000);
    const amount = input.amount - coordinatorFee - miningFee;
    const vsize = roundParameters.maxVsizeAllocationPerAlice - input.inputSize;

    // store RegistrationData and affiliateFlag
    input.setRegistrationData(registrationData, coordinatorFee > 0);
    // and put input to prison
    round.prison.detain(input.outpoint, {
        roundId: round.id,
        reason: coordinator.WabiSabiProtocolErrorCode.AliceAlreadyRegistered,
    });

    // NOTE: RegistrationData processing on middleware is intentionally not using abort signal
    // should not be aborted if round phase was immediately changed after registration (triggered by Status change)
    try {
        // process RegistrationData received from coordinator
        // get Credentials and use them in middleware.getRealCredentials
        const amountCredentials = await middleware.getCredentials(
            round.amountCredentialIssuerParameters,
            registrationData.amountCredentials,
            zeroAmountCredentials.credentialsResponseValidation,
            { baseUrl: middlewareUrl }, // NOTE: without abort signal (should not be aborted)
        );
        const vsizeCredentials = await middleware.getCredentials(
            round.vsizeCredentialIssuerParameters,
            registrationData.vsizeCredentials,
            zeroVsizeCredentials.credentialsResponseValidation,
            { baseUrl: middlewareUrl }, // NOTE: without abort signal (should not be aborted)
        );

        // use Credentials to get RealCredentials. use them in outputConfirmation
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

        logger.log(
            `Registration ~~${input.outpoint}~~ to ~~${round.id}~~ successful. aliceId: ${registrationData.aliceId}`,
        );
        logger.log(
            `~~${input.outpoint}~~ will pay ${coordinatorFee} coordinator fee and ${miningFee} mining fee`,
        );

        // store RealCredentials
        input.setRealCredentials(realAmountCredentials, realVsizeCredentials);
        // set confirmation interval
        input.setConfirmationInterval(confirmationInterval(round, input, options));

        return input;
    } catch (error) {
        // TODO: try to unregister if post processing fails?
        // await coordinator.inputUnregistration(round.id, registrationData.aliceId, {
        //     // signal,
        //     baseUrl: coordinatorUrl,
        //     identity: input.outpoint,
        // });

        input.setError(error);
        return input;
    }
};

export const inputRegistration = async (round: CoinjoinRound, options: CoinjoinRoundOptions) => {
    // try to register each input
    // failed inputs will be excluded from this round, successful will continue to phase: 1 (connectionConfirmation)
    options.logger.log(`inputRegistration: ~~${round.id}~~`);
    round.setSessionPhase(SessionPhase.CoinRegistration);

    const { inputs } = round;
    await Promise.allSettled(inputs.map(input => registerInput(round, input, options))).then(
        result =>
            result.forEach((r, i) => {
                if (r.status !== 'fulfilled') {
                    inputs[i].setError(r.reason);
                }
            }),
    );

    return round;
};
