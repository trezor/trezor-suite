import { outputDecomposition } from './outputDecomposition';
import * as coordinator from '../coordinator';
import * as middleware from '../middleware';
import { sumCredentials } from '../clientUtils';
import type { Account } from '../Account';
import type { Alice } from '../Alice';
import type { CoinjoinPrison } from '../CoinjoinPrison';
import type { CoinjoinRound, CoinjoinRoundOptions } from '../CoinjoinRound';
import type { AccountAddress } from '../../types';
import type { Credentials } from '../../types/middleware';

/**
 * RoundPhase: 2
 *
 */

const registerOutput = async (
    round: CoinjoinRound,
    outputSize: number,
    outputAddress: AccountAddress[],
    outputAmount: number,
    amountCredentials: Credentials[],
    vsizeCredentials: Credentials[],
    prison: CoinjoinPrison,
    options: CoinjoinRoundOptions,
) => {
    const { roundParameters } = round;
    const { signal, coordinatorUrl, middlewareUrl } = options;

    const availableAmount = sumCredentials(amountCredentials);
    const availableVsize = sumCredentials(vsizeCredentials);
    options.log('registerOutput amount', availableAmount);
    options.log('registerOutput vsize', availableVsize);
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

    // TODO: delay + random identity
    const issuanceData = await coordinator.credentialIssuance(
        round.id,
        issuanceAmountCredentials,
        issuanceVsizeCredentials,
        zeroAmountCredentials,
        zeroVsizeCredentials,
        { signal, baseUrl: coordinatorUrl, identity: Date.now().toString(), delay: 0 },
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

    // TODO: catch "AlreadyRegisteredScript" error
    // TODO: keep used addresses in round? dedicated field? in case if accountUpdate is not called on time
    // TODO: tricky, if for some reason AlreadyRegisteredScript is called then we have 2 options:
    // - try again with different address and link my new address with old address (privacy loss?)
    // - intentionally stop output registrations for all credentials? which input will be banned if i call readyToSign on each?
    const tryToRegisterOutput = (): Promise<AccountAddress> => {
        const address = outputAddress.find(a => !prison.isBanned(a.scriptPubKey));
        if (!address) {
            throw new Error('No change address available');
        }

        return coordinator
            .outputRegistration(
                round.id,
                // outputAddress[index],
                address,
                outputAmountCredentials,
                outputVsizeCredentials,
                { signal, baseUrl: coordinatorUrl },
            )
            .then(() => address)
            .catch(error => {
                if (error.message === 'AlreadyRegisteredScript') {
                    prison.ban(address.scriptPubKey, {
                        roundId: round.id,
                        reason: error.message,
                    });
                    return tryToRegisterOutput();
                }
                throw error;
            });
    };

    const address = await tryToRegisterOutput();
    prison.ban(address.scriptPubKey, { roundId: round.id, reason: 'AlreadyRegisteredScript' });

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
        identity: input.outpoint, // recycle input identity
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
        const decomposedGroup = await outputDecomposition(round, accounts, options);

        // collect all used addresses
        const usedAddresses: AccountAddress[] = [];
        // try to register outputs for each account (each input in account group)
        for (let group = 0; group < decomposedGroup.length; group++) {
            const { amounts, accountKey, outputSize } = decomposedGroup[group];
            const account = accounts.find(a => a.accountKey === accountKey);
            if (!account) throw new Error(`Unknown account ${accountKey}`);
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
        options.log('outputRegistration. Ready to sign ', round.id);

        round.addresses = usedAddresses;
    } catch (error) {
        options.log('outputRegistration error: ', error.message);
        // NOTE: if anything goes wrong in this process this Round will be corrupted for all the users
        // registered inputs will probably be banned
        round.inputs.forEach(input =>
            input.setError(new Error(`Output registration failed: ${error.message}`)),
        );
    }
    return round;
};
