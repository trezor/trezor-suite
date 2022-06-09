/* eslint-disable no-await-in-loop */

import * as coordinator from '../coordinator';
import * as middleware from '../middleware';
import { getEvents, compareOutpoint, sumCredentials, getExternalOutputSize } from '../clientUtils';
import type { Account } from '../Account';
import type { Alice } from '../Alice';
import type { CoinjoinRound, CoinjoinRoundOptions } from '../CoinjoinRound';
import type { DecomposedOutputs } from '../../types';

/**
 * RoundPhase: 2, step 1
 * Join all registered Credentials in to one
 */

const joinInputsCredentials = async (
    round: CoinjoinRound,
    accountKey: string,
    inputs: Alice[],
    options: CoinjoinRoundOptions,
) => {
    const { roundParameters } = round;
    const { signal, coordinatorUrl, middlewareUrl } = options;

    let amountCredentials = inputs[0].confirmedAmountCredentials!;
    let vsizeCredentials = inputs[0].confirmedVsizeCredentials!;
    let { outputSize } = inputs[0];

    options.log(`Joining Credentials (${inputs.length}) for account ${accountKey}`);

    if (inputs.length === 1) {
        return {
            accountKey,
            amountCredentials,
            vsizeCredentials,
            outputSize,
        };
    }

    for (let i = 1; i < inputs.length; i++) {
        const current = inputs[i];
        if (current.error) {
            options.log('Trying to join input with error');
            throw current.error;
        }
        options.log(
            'joining',
            i,
            current.confirmedAmountCredentials![0].value,
            current.confirmedAmountCredentials![1].value,
            amountCredentials[0].value,
            amountCredentials[1].value,
        );
        // TODO: do not exceed roundParameters.maxAmountCredentialValue
        const realAmountCredentials = await middleware.getRealCredentials(
            [current.confirmedAmountCredentials![0].value + amountCredentials[0].value, 0],
            [current.confirmedAmountCredentials![0], amountCredentials[0]],
            round.amountCredentialIssuerParameters,
            roundParameters.maxAmountCredentialValue,
            { signal, baseUrl: middlewareUrl },
        );
        // TODO: do not exceed roundParameters.maxVsizeCredentialValue
        const realVsizeCredentials = await middleware.getRealCredentials(
            [vsizeCredentials[0].value, vsizeCredentials[1].value],
            [vsizeCredentials[0], vsizeCredentials[1]],
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

        // TODO: delay + identity (new identity for each loop)
        const joinedIssuance = await coordinator.credentialIssuance(
            round.id,
            realAmountCredentials,
            realVsizeCredentials,
            zeroAmountCredentials,
            zeroVsizeCredentials,
            { signal, baseUrl: coordinatorUrl, identity: Date.now().toString(), delay: 0 },
        );

        amountCredentials = await middleware.getCredentials(
            round.amountCredentialIssuerParameters,
            joinedIssuance.realAmountCredentials,
            realAmountCredentials.credentialsResponseValidation,
            { signal, baseUrl: middlewareUrl },
        );
        vsizeCredentials = await middleware.getCredentials(
            round.vsizeCredentialIssuerParameters,
            joinedIssuance.realVsizeCredentials,
            realVsizeCredentials.credentialsResponseValidation,
            { signal, baseUrl: middlewareUrl },
        );
        outputSize = Math.max(outputSize, current.outputSize);
    }

    return {
        accountKey,
        amountCredentials,
        vsizeCredentials,
        outputSize,
    };
};

const getOutputAmounts = async (
    round: CoinjoinRound,
    accountKey: string,
    availableVsize: number,
    outputSize: number,
    options: CoinjoinRoundOptions,
) => {
    const { roundParameters } = round;
    const { signal, middlewareUrl } = options;

    const registeredInputs = getEvents('InputAdded', round.coinjoinState.events);
    const internalAmounts: number[] = [];
    const externalAmounts: number[] = [];

    registeredInputs.forEach(i => {
        const internal = round.inputs.find(
            input =>
                input.accountKey === accountKey && compareOutpoint(input.outpoint, i.coin.outpoint),
        );
        if (internal) {
            internalAmounts.push(internal.confirmedAmountCredentials![0].value);
        } else {
            const size = getExternalOutputSize(i.coin.txOut.scriptPubKey);
            const miningFee = Math.floor((size * roundParameters.miningFeeRate) / 1000);
            const coordinatorFee = Math.floor(
                roundParameters.coordinationFeeRate.rate * i.coin.txOut.value,
            );
            externalAmounts.push(i.coin.txOut.value - coordinatorFee - miningFee);
        }
    });
    const outputAmounts = await middleware.decomposeAmounts(
        {
            feeRate: roundParameters.miningFeeRate,
            allowedOutputAmounts: roundParameters.allowedOutputAmounts,
        },
        outputSize,
        availableVsize,
        internalAmounts,
        externalAmounts,
        { signal, baseUrl: middlewareUrl },
    );
    options.log('Decompose amounts', outputAmounts);
    return outputAmounts.map(amount => {
        const miningFee = Math.floor((outputSize * roundParameters.miningFeeRate) / 1000);
        const coordinatorFee = 0; // TODO: should be Math.floor(roundParameters.coordinationFeeRate.rate * amount);
        return amount + coordinatorFee + miningFee; // TODO: should be plebs dont pay?
    });
};

export const outputDecomposition = async (
    round: CoinjoinRound,
    _accounts: Account[],
    options: CoinjoinRoundOptions,
): Promise<DecomposedOutputs[]> => {
    // group inputs and outputs addresses by account
    const groupInputsByAccount = round.inputs.reduce((result, input) => {
        if (!result[input.accountKey]) {
            result[input.accountKey] = [];
        }
        if (!input.confirmedAmountCredentials || !input.confirmedVsizeCredentials) {
            throw new Error(`Missing confirmed credentials for ${input.outpoint}`);
        }
        result[input.accountKey].push(input);
        return result;
    }, {} as Record<string, Alice[]>);

    options.log(`Accounts in Round (${Object.keys(groupInputsByAccount).length})`);

    // join registered credentials
    const joinedCredentials = await Promise.all(
        Object.keys(groupInputsByAccount).map(accountKey => {
            options.log('joining credentials: ', groupInputsByAccount[accountKey].length);
            return joinInputsCredentials(
                round,
                accountKey,
                groupInputsByAccount[accountKey],
                options,
            );
        }),
    );

    // decompose output amounts
    const outputAmounts = await Promise.all(
        joinedCredentials.map(({ vsizeCredentials, outputSize, accountKey }) => {
            const availableVsize = sumCredentials(vsizeCredentials);
            return getOutputAmounts(round, accountKey, availableVsize, outputSize, options);
        }),
    );

    // combine everything into DecomposedOutputs objects
    return Object.keys(groupInputsByAccount).map((accountKey, index) => {
        if (!joinedCredentials[index])
            throw new Error(`Missing joined credentials at index ${index}`);
        if (!outputAmounts[index]) throw new Error(`Missing amounts at index ${index}`);
        return {
            ...joinedCredentials[index],
            accountKey,
            amounts: outputAmounts[index],
        };
    });
};
