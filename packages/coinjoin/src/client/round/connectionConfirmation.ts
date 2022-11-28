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

    const zeroAmountCredentials = await middleware.getZeroCredentials(
        round.amountCredentialIssuerParameters,
        { signal, baseUrl: middlewareUrl },
    );
    const zeroVsizeCredentials = await middleware.getZeroCredentials(
        round.vsizeCredentialIssuerParameters,
        { signal, baseUrl: middlewareUrl },
    );

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
            // catch specific error
            if (
                error.message ===
                coordinator.WabiSabiProtocolErrorCode.AliceAlreadyConfirmedConnection
            ) {
                // NOTE: possible race condition between round phases:
                // 1. suite is constantly confirming connection while in phase: 0 (see confirmationInterval below)
                // 2. coordinator changes round phase to 1 before the deadline estimated by suite, suite doesn't know about phase change yet and is still in confirmation interval process
                // 3. confirmation from interval is successfully sent as confirmation in phase: 1
                // 5. suite receives phase change from coordinator and trying to process confirmation in phase: 1
                // and here we are... ignoring it, if input doesn't have confirmedAmountCredentials it will fail in next phase
            } else {
                throw error;
            }
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
