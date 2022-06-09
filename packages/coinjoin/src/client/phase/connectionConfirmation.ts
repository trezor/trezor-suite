import * as coordinator from '../coordinator';
import * as middleware from '../middleware';
import { updateAccountsUtxos } from '../clientUtils';
import { RoundPhase, ActiveRound, ActiveRoundOptions, RegisteredAccountUtxo } from '../../types';

/**
 * RoundPhase: 0
 * Try to confirm registered utxo in InputRegistration phase
 *
 * RoundPhase: 1
 * Try to confirm registered utxo in ActiveRound
 * - if utxo doesn't have registrationData, throw error
 * - if utxo does have ownershipProof but it's already registered, throw error
 * - if Round phase did change before registration, abort remaining awaited registration (if any)
 */

export const confirmInput = async (
    round: ActiveRound,
    utxo: RegisteredAccountUtxo,
    options: ActiveRoundOptions,
): Promise<RegisteredAccountUtxo> => {
    if (utxo.error) return utxo;
    if (!utxo.registrationData || !utxo.realAmountCredentials || !utxo.realVsizeCredentials) {
        throw new Error(`Trying to confirm unregistered input ${utxo.outpoint}`);
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
    log(`Confirming ${utxo.outpoint} to ${round.id} with delay ${delay}ms`);

    const confirmationData = await coordinator.connectionConfirmation(
        round.id,
        utxo.registrationData.aliceId,
        utxo.realAmountCredentials,
        utxo.realVsizeCredentials,
        zeroAmountCredentials,
        zeroVsizeCredentials,
        { signal, baseUrl: coordinatorUrl, identity: utxo.outpoint, delay },
    );

    // stop here if it's called from input-registration interval
    if (round.phase === RoundPhase.InputRegistration) {
        return utxo;
    }

    const confirmedAmountCredentials = await middleware.getCredentials(
        round.amountCredentialIssuerParameters,
        confirmationData.realAmountCredentials,
        utxo.realAmountCredentials.credentialsResponseValidation,
        { baseUrl: middlewareUrl }, // NOTE: post processing intentionally without abort signal (should not be aborted)
    );
    const confirmedVsizeCredentials = await middleware.getCredentials(
        round.vsizeCredentialIssuerParameters,
        confirmationData.realVsizeCredentials,
        utxo.realVsizeCredentials.credentialsResponseValidation,
        { baseUrl: middlewareUrl }, // NOTE: post processing intentionally without abort signal (should not be aborted)
    );

    log(`Confirmed ${utxo.outpoint} in ${round.id}`);

    return {
        ...utxo,
        confirmationData,
        confirmedAmountCredentials,
        confirmedVsizeCredentials,
    };
};

export const connectionConfirmation = async (
    round: ActiveRound,
    options: ActiveRoundOptions,
): Promise<ActiveRound> => {
    // try to confirm each utxo
    const utxosToConfirm = Object.values(round.accounts).flatMap(account => account.utxos);
    const confirmedUtxos = await Promise.allSettled(
        utxosToConfirm.map(utxo => confirmInput(round, utxo, options)),
    ).then(result =>
        result.map((r, i) =>
            r.status === 'fulfilled' ? r.value : { ...utxosToConfirm[i], error: r.reason },
        ),
    );
    return {
        ...round,
        accounts: updateAccountsUtxos(round.accounts, confirmedUtxos),
    };
};
