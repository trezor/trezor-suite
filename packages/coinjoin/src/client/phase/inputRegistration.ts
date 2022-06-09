import * as coordinator from '../coordinator';
import * as middleware from '../middleware';
import { confirmInput } from './connectionConfirmation';
import { getInputSize, getRandomDelay, updateAccountsUtxos } from '../clientUtils';
import {
    ActiveRound,
    ActiveRoundOptions,
    RegisteredAccountUtxo,
    AllowedScriptTypes,
} from '../../types';

/**
 * RoundPhase: 0
 * Try to register available utxo in to ActiveRound
 * - if utxo doesn't have ownershipProof ask wallet to provide it
 * - if utxo does have ownershipProof but it's already registered, throw error
 * - if Round phase did change before registration, abort remaining awaited registration (if any)
 * - if Round inputRegistrationEnd value is greater than connectionConfirmationTimeout periodically call confirmInput ping to coordinator
 */

const confirmationInterval = (
    round: ActiveRound,
    utxo: RegisteredAccountUtxo,
    options: ActiveRoundOptions,
) => {
    const deadline = new Date(round.roundParameters.inputRegistrationEnd).getTime();
    const utxoDeadline = Math.floor(60000 * 0.5); // round.roundParameters.connectionConfirmationTimeout * 0.9
    let timeLeft = deadline - Date.now();
    if (timeLeft < utxoDeadline || options.signal.aborted) {
        options.log(`Ignoring confirmation interval. Deadline ${timeLeft}`);
        return utxo;
    }

    options.log(`Setting confirmation interval. Deadline ${timeLeft}ms`);

    return new Promise<RegisteredAccountUtxo>(resolve => {
        let timeout: ReturnType<typeof setTimeout>;
        const timeoutFn = async () => {
            try {
                await confirmInput(round, utxo, options);
                timeLeft = deadline - Date.now();
                options.log(
                    `Confirmation interval. Deadline ${timeLeft}ms. ${round.id} ${
                        utxo.registrationData!.aliceId
                    }`,
                );
                if (timeLeft > utxoDeadline) {
                    timeout = setTimeout(timeoutFn, utxoDeadline);
                } else {
                    // Alice deadline should be ok now
                    resolve(utxo);
                }
            } catch (error) {
                options.log(`Confirmation interval with error ${error.message}`);
                // do nothing, it will be processed in next phase
                resolve(utxo);
            }
        };

        timeout = setTimeout(timeoutFn, utxoDeadline);

        options.signal.addEventListener('abort', () => {
            options.log(`Confirmation interval aborted`);
            clearTimeout(timeout);
            resolve(utxo);
        });
    });
};

const registerInput = async (
    round: ActiveRound,
    utxoType: AllowedScriptTypes,
    utxo: RegisteredAccountUtxo,
    options: ActiveRoundOptions,
): Promise<RegisteredAccountUtxo> => {
    if (utxo.error) {
        options.log(`inputRegistration: ${round.id}`);
        return utxo;
    }
    // stop here and request for ownership proof from the wallet
    if (!utxo.ownershipProof) {
        options.log(`waiting for ownership proof ${utxo.outpoint}`);
        return utxo;
    }

    if (utxo.registrationData) {
        throw new Error(`Input ${utxo.outpoint} already registered`);
    }

    const inputSize = getInputSize(utxoType);
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
    options.log(`Trying to register ${utxo.outpoint} to ${round.id} with delay ${delay}ms`);

    const registrationData = await coordinator
        .inputRegistration(
            round.id,
            utxo.outpoint,
            utxo.ownershipProof,
            zeroAmountCredentials,
            zeroVsizeCredentials,
            {
                signal,
                baseUrl: coordinatorUrl,
                identity: utxo.outpoint,
                delay,
            },
        )
        .catch(error => {
            options.log(`Registration ${utxo.outpoint} to ${round.id} failed: ${error.message}`);
            if (error.message === 'WrongPhase') {
                // abort remaining candidates to register (if exists) it's not going to happen anyway
                signal.dispatchEvent(new Event('abort'));
            }
            throw error;
        });

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
            utxo.amount > roundParameters.coordinationFeeRate.plebsDontPayThreshold &&
            !registrationData.isPayingZeroCoordinationFee
                ? Math.floor(roundParameters.coordinationFeeRate.rate * utxo.amount)
                : 0;

        const miningFee = Math.floor((inputSize * roundParameters.miningFeeRate) / 1000);
        const amount = utxo.amount - coordinatorFee - miningFee;
        const vsize = roundParameters.maxVsizeAllocationPerAlice - inputSize;

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
            `Registration ${utxo.outpoint} to ${round.id} successful. aliceId: ${registrationData.aliceId}`,
        );

        // Input registration process requires to call /connection-confirmation
        // in intervals less than connectionConfirmationTimeout * 0.9 to prevent AliceTimeout on coordinator
        return confirmationInterval(
            round,
            {
                ...utxo,
                registrationData,
                realAmountCredentials,
                realVsizeCredentials,
            },
            options,
        );
    } catch (error) {
        // TODO: try to unregister if post processing fails
        // await coordinator.inputUnregistration(round.id, registrationData.aliceId, {
        //     // signal,
        //     baseUrl: coordinatorUrl,
        //     identity: utxo.outpoint,
        // });

        return {
            ...utxo,
            registrationData,
            error,
        };
    }
};

export const inputRegistration = async (
    round: ActiveRound,
    options: ActiveRoundOptions,
): Promise<ActiveRound> => {
    // try to register each utxo.
    // failed utxos will be excluded from this round
    // process the result in ./processRounds.ts > postProcessRounds
    options.log(`inputRegistration: ${round.id}`);
    const utxosToRegister = Object.values(round.accounts).flatMap(account => account.utxos);
    const utxosPromise = Object.values(round.accounts).flatMap(account =>
        account.utxos.map(utxo => registerInput(round, account.type, utxo, options)),
    );
    const registeredUtxos = await Promise.allSettled(utxosPromise).then(result =>
        result.map((r, i) =>
            r.status === 'fulfilled' ? r.value : { ...utxosToRegister[i], error: r.reason },
        ),
    );

    return {
        ...round,
        accounts: updateAccountsUtxos(round.accounts, registeredUtxos),
    };
};
