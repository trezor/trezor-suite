import { outputDecomposition } from './outputDecomposition';
import * as coordinator from '../coordinator';
import * as middleware from '../middleware';
import { sumCredentials, updateAccountsUtxos } from '../clientUtils';
import {
    ActiveRound,
    ActiveRoundOptions,
    RegisteredAccount,
    RegisteredAccountUtxo,
    RegisteredAccountAddress,
    Credentials,
} from '../../types';

/**
 * RoundPhase: 2
 *
 */

const registerOutput = async (
    round: ActiveRound,
    outputSize: number,
    outputAddress: RegisteredAccountAddress[],
    outputAmount: number,
    amountCredentials: Credentials[], // TODO types
    vsizeCredentials: Credentials[],
    options: ActiveRoundOptions,
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
    // - intentionally stop output registrations for all credentials? which utxo will be banned if i call readyToSign on each?
    const cycle = (index: number): Promise<any> =>
        coordinator
            .outputRegistration(
                round.id,
                outputAddress[index],
                outputAmountCredentials,
                outputVsizeCredentials,
                { signal, baseUrl: coordinatorUrl },
            )
            .catch(error => {
                if (error.message === 'AlreadyRegisteredScript') {
                    if (!outputAddress[index + 1]) {
                        throw new Error('no more addresses');
                    }
                    return cycle(index + 1);
                }
                throw error;
            });

    await cycle(0);

    return {
        amountCredentials: [amountCredentialsOut[1], zeroAmountCredentialsOut[1]],
        vsizeCredentials: [vsizeCredentialsOut[1], zeroVsizeCredentialsOut[1]],
    };
};

// TODO: delay
const readyToSign = (
    round: ActiveRound,
    utxo: RegisteredAccountUtxo,
    { signal, coordinatorUrl }: ActiveRoundOptions,
) =>
    coordinator.readyToSign(round.id, utxo.registrationData!.aliceId, {
        signal,
        baseUrl: coordinatorUrl,
        identity: utxo.outpoint, // recycle input identity
        delay: 0,
    });

export const outputRegistration = async (
    round: ActiveRound,
    accounts: RegisteredAccount[],
    options: ActiveRoundOptions,
): Promise<ActiveRound> => {
    // TODO:
    // - decide if there is only 1 account registered should i abaddon this round and blame it on some "youngest" utxo?
    // - maybe if there is only 1 account utxos are so "far away" from each other that it is wort to mix anyway?
    try {
        // decompose output amounts for all registered utxos grouped by Account
        const decomposedGroup = await outputDecomposition(round, accounts, options);
        // collect all used addresses
        const usedAddresses: RegisteredAccount['addresses'] = [];
        // try to register outputs for each account (each utxo in account group)
        for (let group = 0; group < decomposedGroup.length; group++) {
            const { amounts, addresses, outputSize } = decomposedGroup[group];
            let { amountCredentials, vsizeCredentials } = decomposedGroup[group];
            for (let index = 0; index < amounts.length; index++) {
                if (!addresses[index]) throw new Error(`Unknown address at index ${index}`);
                // eslint-disable-next-line no-await-in-loop
                const result = await registerOutput(
                    round,
                    outputSize,
                    addresses.slice(index),
                    amounts[index],
                    amountCredentials,
                    vsizeCredentials,
                    options,
                );
                console.warn('register output in RESULT', result);
                usedAddresses.push(addresses[index]);
                amountCredentials = result.amountCredentials;
                vsizeCredentials = result.vsizeCredentials;
            }
        }

        // inform coordinator that each registered utxo is ready to sign
        const readyUtxos = Object.values(round.accounts).flatMap(account => account.utxos);
        await Promise.all(readyUtxos.map(utxo => readyToSign(round, utxo, options)));
        options.log('outputRegistration. Ready to sign ', round.id);

        return {
            ...round,
            addresses: usedAddresses,
        };
    } catch (error) {
        options.log('outputRegistration error: ', error.message);
        // NOTE: if anything goes wrong in this process this Round will be corrupted for all the users
        // registered utxos will probably be banned
        const failedUtxos = Object.values(round.accounts).flatMap(account =>
            account.utxos.map(utxo => ({
                ...utxo,
                error: new Error(`Output registration failed: ${error.message}`),
            })),
        );
        return {
            ...round,
            accounts: updateAccountsUtxos(round.accounts, failedUtxos),
            // utxos: round.utxos.map(utxo => ({
            //     ...utxo,
            //     error: new Error(`Output registration failed: ${error.message}`),
            // })),
        };
    }
};
