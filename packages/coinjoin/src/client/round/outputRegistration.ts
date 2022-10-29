import { getWeakRandomId } from '@trezor/utils';

import * as coordinator from '../coordinator';
import * as middleware from '../middleware';
import { outputDecomposition } from './outputDecomposition';
import { sumCredentials } from '../../utils/roundUtils';
import type { Account } from '../Account';
import type { Alice } from '../Alice';
import type { CoinjoinPrison } from '../CoinjoinPrison';
import type { CoinjoinRound, CoinjoinRoundOptions } from '../CoinjoinRound';
import type { AccountAddress } from '../../types';

/**
 * RoundPhase: 2, OutputRegistration
 *
 * Process steps:
 * - Calculate output amounts using middleware (see ./outputDecomposition)
 * - Join all input Credentials in to one using coordinator /credential-issuance (see ./outputDecomposition)
 * - Decompose joined Credentials into calculated amounts using coordinator /credential-issuance
 * - Register decomposed Credentials as outputs using coordinator /output-registration
 * - Finally call /ready-to-sign on coordinator for each input
 */

const registerOutput = async (
    round: CoinjoinRound,
    outputSize: number,
    outputAddress: AccountAddress[],
    outputAmount: number,
    amountCredentials: middleware.Credentials[],
    vsizeCredentials: middleware.Credentials[],
    prison: CoinjoinPrison,
    options: CoinjoinRoundOptions,
) => {
    const { roundParameters } = round;
    const { signal, coordinatorUrl, middlewareUrl } = options;

    const availableAmount = sumCredentials(amountCredentials);
    const availableVsize = sumCredentials(vsizeCredentials);
    options.log(`registerOutput amount ${availableAmount}`);
    options.log(`registerOutput vsize ${availableVsize}`);
    const issuanceAmountCredentials = await middleware.getRealCredentials(
        [outputAmount, availableAmount - outputAmount],
        amountCredentials,
        round.amountCredentialIssuerParameters,
        roundParameters.maxAmountCredentialValue,
        { signal, baseUrl: middlewareUrl },
    );
    const issuanceVsizeCredentials = await middleware.getRealCredentials(
        [outputSize, availableVsize - outputSize],
        vsizeCredentials,
        round.vsizeCredentialIssuerParameters,
        roundParameters.maxVsizeCredentialValue,
        { signal, baseUrl: middlewareUrl },
    );

    const zeroAmountCredentials = await middleware.getZeroCredentials(
        round.amountCredentialIssuerParameters,
        { signal, baseUrl: middlewareUrl },
    );
    const zeroVsizeCredentials = await middleware.getZeroCredentials(
        round.vsizeCredentialIssuerParameters,
        { signal, baseUrl: middlewareUrl },
    );

    // TODO: delay
    // use random identity
    const issuanceData = await coordinator.credentialIssuance(
        round.id,
        issuanceAmountCredentials,
        issuanceVsizeCredentials,
        zeroAmountCredentials,
        zeroVsizeCredentials,
        { signal, baseUrl: coordinatorUrl, identity: getWeakRandomId(10), delay: 0 },
    );

    const amountCredentialsOut = await middleware.getCredentials(
        round.amountCredentialIssuerParameters,
        issuanceData.realAmountCredentials,
        issuanceAmountCredentials.credentialsResponseValidation,
        { signal, baseUrl: middlewareUrl },
    );
    const vsizeCredentialsOut = await middleware.getCredentials(
        round.vsizeCredentialIssuerParameters,
        issuanceData.realVsizeCredentials,
        issuanceVsizeCredentials.credentialsResponseValidation,
        { signal, baseUrl: middlewareUrl },
    );

    const zeroAmountCredentialsOut = await middleware.getCredentials(
        round.amountCredentialIssuerParameters,
        issuanceData.zeroAmountCredentials,
        zeroAmountCredentials.credentialsResponseValidation,
        { signal, baseUrl: middlewareUrl },
    );

    const zeroVsizeCredentialsOut = await middleware.getCredentials(
        round.vsizeCredentialIssuerParameters,
        issuanceData.zeroVsizeCredentials,
        zeroVsizeCredentials.credentialsResponseValidation,
        { signal, baseUrl: middlewareUrl },
    );

    const outputAmountCredentials = await middleware.getRealCredentials(
        [0, 0],
        [amountCredentialsOut[0], zeroAmountCredentialsOut[0]],
        round.amountCredentialIssuerParameters,
        roundParameters.maxAmountCredentialValue,
        { signal, baseUrl: middlewareUrl },
    );
    const outputVsizeCredentials = await middleware.getRealCredentials(
        [vsizeCredentialsOut[0].value - outputSize, 0],
        [vsizeCredentialsOut[0], zeroVsizeCredentialsOut[0]],
        round.vsizeCredentialIssuerParameters,
        roundParameters.maxVsizeCredentialValue,
        { signal, baseUrl: middlewareUrl },
    );

    // TODO: tricky, if for some reason AlreadyRegisteredScript is called then we have 2 options:
    // - try again with different address and link my new address with old address (privacy loss against coordinator?)
    // - intentionally stop output registrations for all other credentials. Question: which input will be banned if i call readyToSign on each anyway? is it better to break here and not to proceed to signing?
    const tryToRegisterOutput = (): Promise<AccountAddress> => {
        const address = outputAddress.find(a => !prison.isDetained(a.scriptPubKey));
        if (!address) {
            throw new Error('No change address available');
        }

        return coordinator
            .outputRegistration(
                round.id,
                address,
                outputAmountCredentials,
                outputVsizeCredentials,
                { signal, baseUrl: coordinatorUrl, identity: getWeakRandomId(10) },
            )
            .then(() => address)
            .catch(error => {
                if (
                    error.message === coordinator.WabiSabiProtocolErrorCode.AlreadyRegisteredScript
                ) {
                    prison.detain(address.scriptPubKey, {
                        roundId: round.id,
                        reason: error.message,
                    });
                    return tryToRegisterOutput();
                }
                throw error;
            });
    };

    const address = await tryToRegisterOutput();
    prison.detain(address.scriptPubKey, {
        roundId: round.id,
        reason: coordinator.WabiSabiProtocolErrorCode.AlreadyRegisteredScript,
    });

    return {
        address,
        amountCredentials: [amountCredentialsOut[1], zeroAmountCredentialsOut[1]],
        vsizeCredentials: [vsizeCredentialsOut[1], zeroVsizeCredentialsOut[1]],
    };
};

// TODO: delay
const readyToSign = (
    round: CoinjoinRound,
    input: Alice,
    { signal, coordinatorUrl }: CoinjoinRoundOptions,
) =>
    coordinator.readyToSign(round.id, input.registrationData!.aliceId, {
        signal,
        baseUrl: coordinatorUrl,
        identity: input.outpoint, // NOTE: recycle input identity
        delay: 0,
    });

export const outputRegistration = async (
    round: CoinjoinRound,
    accounts: Account[],
    prison: CoinjoinPrison,
    options: CoinjoinRoundOptions,
) => {
    // TODO:
    // - decide if there is only 1 account registered should i abaddon this round and blame it on some "youngest" input?
    // - maybe if there is only 1 account inputs are so "far away" from each other that it is wort to mix anyway?
    try {
        // decompose output amounts for all registered inputs grouped by Account
        const decomposedGroup = await outputDecomposition(round, options);

        // collect all used addresses
        const usedAddresses: AccountAddress[] = [];
        // try to register outputs for each account (each input in account group)
        for (let group = 0; group < decomposedGroup.length; group++) {
            const { amounts, accountKey, outputSize } = decomposedGroup[group];
            const account = accounts.find(a => a.accountKey === accountKey);
            if (!account) throw new Error(`Unknown account ~~${accountKey}~~`);
            const { changeAddresses } = account;
            let { amountCredentials, vsizeCredentials } = decomposedGroup[group];
            for (let index = 0; index < amounts.length; index++) {
                if (!amounts[index]) throw new Error(`Unknown amount at index ${index}`);
                // TODO: no not proceed if one of output fails (do not sign!!)
                // eslint-disable-next-line no-await-in-loop
                const result = await registerOutput(
                    round,
                    outputSize,
                    changeAddresses,
                    amounts[index],
                    amountCredentials,
                    vsizeCredentials,
                    prison,
                    options,
                );
                usedAddresses.push(result.address);
                amountCredentials = result.amountCredentials;
                vsizeCredentials = result.vsizeCredentials;
            }
        }

        // inform coordinator that each registered input is ready to sign
        await Promise.all(round.inputs.map(input => readyToSign(round, input, options)));
        options.log(`Ready to sign ~~${round.id}~~`);

        round.addresses = usedAddresses;
    } catch (error) {
        // NOTE: if anything goes wrong in this process this Round will be corrupted for all the users
        // registered inputs will probably be banned
        const message = `Output registration in ~~${round.id}~~ failed: ${error.message}`;
        options.log(message);

        round.inputs.forEach(input => input.setError(new Error(message)));
    }
    return round;
};
