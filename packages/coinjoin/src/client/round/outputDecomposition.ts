/* eslint-disable no-await-in-loop */
import { getWeakRandomId } from '@trezor/utils';

import * as coordinator from '../coordinator';
import * as middleware from '../middleware';
import { getRoundEvents, compareOutpoint, sumCredentials } from '../../utils/roundUtils';
import { getExternalOutputSize } from '../../utils/coordinatorUtils';
import type { Alice } from '../Alice';
import type { CoinjoinRound, CoinjoinRoundOptions } from '../CoinjoinRound';

/**
 * RoundPhase: 2, step 1
 *
 * - Join all registered inputs Credentials in to one, grouped by accountKey
 * - Calculate output amounts
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

    options.log(
        `Joining Credentials for account ~~${accountKey}~~. Total inputs: ${inputs.length}`,
    );

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
            options.log(
                `Trying to join input with error. ~~${current.outpoint}~~ ${current.error}`,
            );
            throw current.error;
        }
        options.log(
            `Joining${i} ${current.confirmedAmountCredentials![0].value} ${
                current.confirmedAmountCredentials![1].value
            } ${amountCredentials[0].value} ${amountCredentials[1].value} `,
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

        // TODO: delay
        // use random identity for each request
        const joinedIssuance = await coordinator.credentialIssuance(
            round.id,
            realAmountCredentials,
            realVsizeCredentials,
            zeroAmountCredentials,
            zeroVsizeCredentials,
            {
                signal,
                baseUrl: coordinatorUrl,
                identity: getWeakRandomId(10),
                delay: 0,
                deadline: round.phaseDeadline,
            },
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

export const getOutputAmounts = async (
    round: CoinjoinRound,
    accountKey: string,
    availableVsize: number,
    outputSize: number,
    options: CoinjoinRoundOptions,
) => {
    const { roundParameters } = round;
    const { signal, middlewareUrl } = options;

    const registeredInputs = getRoundEvents('InputAdded', round.coinjoinState.events);
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
        availableVsize, // TODO: sum all available vsize and use chunks in output registration (increase nr of outputs)
        internalAmounts,
        externalAmounts,
        { signal, baseUrl: middlewareUrl },
    );
    options.log(`Decompose amounts: ${outputAmounts.join('')}`);
    return outputAmounts.map(amount => {
        const miningFee = Math.floor((outputSize * roundParameters.miningFeeRate) / 1000);
        const coordinatorFee = 0; // NOTE: middleware issue https://github.com/zkSNACKs/WalletWasabi/issues/8814 should be `amount > plebsDontPayThreshold ? Math.floor(roundParameters.coordinationFeeRate.rate * amount) : 0` but middleware does not considerate coordinationFeeRate and plebs for external amounts
        return amount + coordinatorFee + miningFee;
    });
};

export interface DecomposedOutputs {
    accountKey: string;
    outputSize: number;
    amounts: number[];
    amountCredentials: middleware.Credentials[];
    vsizeCredentials: middleware.Credentials[];
}

export const outputDecomposition = async (
    round: CoinjoinRound,
    options: CoinjoinRoundOptions,
): Promise<DecomposedOutputs[]> => {
    // group inputs by accountKeys
    const groupInputsByAccount = round.inputs.reduce((result, input) => {
        if (!result[input.accountKey]) {
            result[input.accountKey] = [];
        }
        if (!input.confirmedAmountCredentials || !input.confirmedVsizeCredentials) {
            throw new Error(`Missing confirmed credentials for ~~${input.outpoint}~~`);
        }
        result[input.accountKey].push(input);
        return result;
    }, {} as Record<string, Alice[]>);

    options.log(`Decompose ${Object.keys(groupInputsByAccount).length} accounts`);

    // join inputs Credentials for each account separately
    const joinedCredentials = await Promise.all(
        Object.keys(groupInputsByAccount).map(accountKey =>
            joinInputsCredentials(round, accountKey, groupInputsByAccount[accountKey], options),
        ),
    );

    // calculate amounts
    const outputAmounts = await Promise.all(
        joinedCredentials.map(({ vsizeCredentials, outputSize, accountKey }) => {
            const availableVsize = sumCredentials(vsizeCredentials);
            return getOutputAmounts(round, accountKey, availableVsize, outputSize, options);
        }),
    );

    // combine everything into DecomposedOutputs objects and return the result to outputRegistration
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
