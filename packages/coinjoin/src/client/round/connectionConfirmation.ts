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
    if (input.confirmedAmountCredentials && input.confirmedVsizeCredentials) {
        options.log(`Input ~~${input.outpoint}~~ already confirmed. Skipping.`);
        return input;
    }

    const { signal, coordinatorUrl, middlewareUrl, log } = options;

    const { confirmationParams } = input;
    if (confirmationParams) {
        // corner-case: connectionConfirmation request was delivered to coordinator but response was not received by client then request timeout or round phase changed happens.
        // input is confirmed on coordinator but there is no confirmationData to continue. repeated request fails with AliceAlreadyConfirmedConnection
        // solution: coordinator request might be recovered from cache by using exactly same params as before
        // for that case use zeroAmountCredentials and zeroVsizeCredentials cached by failed request (below)
        options.log(`Trying to restore confirmation data for ~~${input.outpoint}~~`);
    }

    const zeroAmountCredentials = confirmationParams
        ? confirmationParams.zeroAmountCredentials
        : await middleware.getZeroCredentials(round.amountCredentialIssuerParameters, {
              signal,
              baseUrl: middlewareUrl,
          });
    const zeroVsizeCredentials = confirmationParams
        ? confirmationParams.zeroVsizeCredentials
        : await middleware.getZeroCredentials(round.vsizeCredentialIssuerParameters, {
              signal,
              baseUrl: middlewareUrl,
          });

    // try not to hit real
    const inputDeadline = input.confirmationDeadline - Date.now();
    const delay =
        inputDeadline > 0 && input.confirmationDeadline < round.phaseDeadline ? inputDeadline : 0;
    const deadline = round.phaseDeadline;
    log(
        `Confirming ~~${input.outpoint}~~ to ~~${round.id}~~ phase ${round.phase} with delay ${delay}ms and deadline ${deadline}`,
    );

    const confirmationData = await coordinator
        .connectionConfirmation(
            round.id,
            input.registrationData.aliceId,
            input.realAmountCredentials,
            input.realVsizeCredentials,
            zeroAmountCredentials,
            zeroVsizeCredentials,
            { signal, baseUrl: coordinatorUrl, identity: input.outpoint, delay, deadline },
        )
        .catch(error => {
            log(`Confirmation failed ~~${input.outpoint}~~ in ~~${round.id}~~. Reason: ${error}`);
            // if error is not WabiSabiProtocolErrorCode like AliceNotFound, AliceAlreadyConfirmedConnection or other protocol violation
            if (!Object.keys(coordinator.WabiSabiProtocolErrorCode).includes(error.message)) {
                // then store failed params for recovering (see description above)
                input.setConfirmationParams(zeroAmountCredentials, zeroVsizeCredentials);
            }

            throw error;
        });

    // stop here if it's confirmationInterval at phase 0
    if (
        !confirmationData ||
        !confirmationData.realAmountCredentials ||
        !confirmationData.realVsizeCredentials
    ) {
        log(`Confirmed in phase ${round.phase} ~~${input.outpoint}~~ in ~~${round.id}~~`);
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

    log(`Confirmed ~~${input.outpoint}~~ in ~~${round.id}~~`);

    // reset confirmation params if used
    input.setConfirmationParams();
    input.setConfirmationData(confirmationData);
    input.setConfirmedCredentials(confirmedAmountCredentials, confirmedVsizeCredentials);

    return input;
};

// Because of the nature of coordinator successful registration process requires
// to call `/connection-confirmation` in intervals less than connectionConfirmationTimeout * 0.5 to prevent AliceTimeout error on coordinator
// https://github.com/trezor/WalletWasabi/blob/master/WalletWasabi/WabiSabi/Client/AliceClient.cs
export const confirmationInterval = (
    round: CoinjoinRound,
    input: Alice,
    options: CoinjoinRoundOptions,
): Promise<Alice> => {
    const { phaseDeadline } = round;
    const timeoutDeadline = Math.floor(
        readTimeSpan(round.roundParameters.connectionConfirmationTimeout) * 0.5,
    );

    return new Promise<Alice>(resolve => {
        const done = () => {
            options.log(`Confirmation interval for ~~${input.outpoint}~~ completed`);
            resolve(input);
        };

        const timeoutFn = async () => {
            input.confirmationDeadline = Date.now() + timeoutDeadline;
            const timeLeft = phaseDeadline - Date.now();
            if (input.confirmationData || timeLeft < timeoutDeadline || options.signal.aborted) {
                options.log(
                    `Ignoring confirmation interval for ~~${input.outpoint}~~. Deadline ${timeLeft}ms`,
                );
                done();
                return;
            }

            options.log(
                `Setting confirmation interval for ~~${input.outpoint}~~. Deadline ${timeLeft}ms`,
            );

            try {
                await confirmInput(round, input, options);
                timeoutFn();
            } catch (error) {
                options.log(`Confirmation interval with error ${error.message}`);
                // do nothing. confirmationInterval might be aborted by Round phase change.
                // error (if it's relevant) will be processed in next phase in confirmInput
                done();
            }
        };

        timeoutFn();
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
