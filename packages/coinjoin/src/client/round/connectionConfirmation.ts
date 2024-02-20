import * as coordinator from '../coordinator';
import * as middleware from '../middleware';
import { readTimeSpan } from '../../utils/roundUtils';
import type { Alice, AliceConfirmationInterval } from '../Alice';
import type { CoinjoinRound, CoinjoinRoundOptions } from '../CoinjoinRound';
import { SessionPhase, WabiSabiProtocolErrorCode } from '../../enums';

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
    delay: number,
    options: CoinjoinRoundOptions,
): Promise<Alice> => {
    if (input.error) {
        options.logger.warn(`Trying to confirm input with error ${input.error}`);
        throw input.error;
    }
    if (!input.registrationData || !input.realAmountCredentials || !input.realVsizeCredentials) {
        throw new Error(`Trying to confirm unregistered input ~~${input.outpoint}~~`);
    }
    if (input.confirmedAmountCredentials && input.confirmedVsizeCredentials) {
        options.logger.info(`Input ~~${input.outpoint}~~ already confirmed. Skipping.`);

        return input;
    }

    const { signal, coordinatorUrl, middlewareUrl, logger } = options;

    const zeroAmountCredentials = await middleware.getZeroCredentials(
        round.amountCredentialIssuerParameters,
        {
            signal,
            baseUrl: middlewareUrl,
        },
    );
    const zeroVsizeCredentials = await middleware.getZeroCredentials(
        round.vsizeCredentialIssuerParameters,
        {
            signal,
            baseUrl: middlewareUrl,
        },
    );

    const deadline =
        round.phaseDeadline + readTimeSpan(round.roundParameters.ConnectionConfirmationTimeout);

    logger.info(
        `Confirming ~~${input.outpoint}~~ to ~~${round.id}~~ phase ${round.phase} with delay ${delay}ms and deadline ${deadline}`,
    );

    const confirmationData = await coordinator.connectionConfirmation(
        round.id,
        input.registrationData.AliceId,
        input.realAmountCredentials,
        input.realVsizeCredentials,
        zeroAmountCredentials,
        zeroVsizeCredentials,
        { signal, baseUrl: coordinatorUrl, identity: input.outpoint, delay, deadline },
    );

    // stop here if it's confirmationInterval at phase 0
    if (
        !confirmationData ||
        !confirmationData.RealAmountCredentials ||
        !confirmationData.RealVsizeCredentials
    ) {
        logger.info(`Confirmed in phase ${round.phase} ~~${input.outpoint}~~ in ~~${round.id}~~`);

        return input;
    }

    const confirmedAmountCredentials = await middleware.getCredentials(
        round.amountCredentialIssuerParameters,
        confirmationData.RealAmountCredentials,
        input.realAmountCredentials.CredentialsResponseValidation,
        { baseUrl: middlewareUrl }, // NOTE: post processing intentionally without abort signal (should not be aborted)
    );
    const confirmedVsizeCredentials = await middleware.getCredentials(
        round.vsizeCredentialIssuerParameters,
        confirmationData.RealVsizeCredentials,
        input.realVsizeCredentials.CredentialsResponseValidation,
        { baseUrl: middlewareUrl }, // NOTE: post processing intentionally without abort signal (should not be aborted)
    );

    logger.info(`Confirmed ~~${input.outpoint}~~ in ~~${round.id}~~`);

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
): AliceConfirmationInterval => {
    const intervalDelay = Math.floor(
        readTimeSpan(round.roundParameters.ConnectionConfirmationTimeout) * 0.5,
    );
    let requestLatency = 0;

    const controller = new AbortController();

    const promise = new Promise<Alice>(resolve => {
        const { logger } = options;
        const done = () => {
            logger.info(`Confirmation interval for ~~${input.outpoint}~~ completed`);
            resolve(input);
        };

        const timeoutFn = async () => {
            const delay = Math.max(intervalDelay - requestLatency, 0);
            logger.info(
                `Setting confirmation interval for ~~${input.outpoint}~~. Delay ${delay}ms`,
            );

            try {
                const start = Date.now() + delay;
                await confirmInput(round, input, delay, {
                    ...options,
                    signal: controller.signal,
                });
                // in case of slow network requests might take up to 40+ sec,
                // measure the latency and reduce intervalDelay in future request
                requestLatency = Date.now() - start;

                if (input.confirmationData) {
                    done();
                } else {
                    timeoutFn();
                }
            } catch (error) {
                if (
                    !controller.signal.aborted &&
                    error.errorCode !== WabiSabiProtocolErrorCode.WrongPhase
                ) {
                    input.setError(error);
                }
                logger.warn(`Confirmation interval with error ${error.message}`);
                // do nothing. confirmationInterval might be aborted by Round phase change.
                // error (if it's relevant) will be processed in next phase in confirmInput
                done();
            }
        };

        timeoutFn();
    });

    return {
        abort: () => {
            controller.abort();

            // We only need to unregister if Alice wouldn't be removed automatically by the coordinator - otherwise just leave it there.
            const wouldBeRemovedByBackend = round.phaseDeadline - intervalDelay - Date.now() > 0;
            if (!wouldBeRemovedByBackend && input.registrationData) {
                coordinator
                    .inputUnregistration(round.id, input.registrationData.AliceId, {
                        signal: options.signal,
                        baseUrl: options.coordinatorUrl,
                        identity: input.outpoint,
                    })
                    .catch(() => {
                        // ignore if unregistration fails
                    });
            }
        },
        promise,
    };
};

export const connectionConfirmation = async (
    round: CoinjoinRound,
    options: CoinjoinRoundOptions,
) => {
    // try to confirm each input
    // failed inputs will be excluded from this round, successful will continue to phase: 2 (outputRegistration)
    options.logger.info(`connectionConfirmation: ~~${round.id}~~`);
    round.setSessionPhase(SessionPhase.AwaitingConfirmation);

    const { inputs } = round;
    await Promise.allSettled(
        inputs.map(input => {
            const interval =
                input.getConfirmationInterval() || confirmationInterval(round, input, options);
            if (!input.getConfirmationInterval()) {
                input.setConfirmationInterval(interval);
            }

            return interval.promise;
        }),
    ).then(result =>
        result.forEach((r, i) => {
            if (r.status !== 'fulfilled') {
                inputs[i].setError(r.reason);
            }
        }),
    );

    round.setSessionPhase(SessionPhase.AwaitingOthersConfirmation);

    return round;
};
