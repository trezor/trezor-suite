/* eslint-disable no-await-in-loop */
import * as coordinator from '../coordinator';
import * as middleware from '../middleware';
import {
    getEvents,
    compareOutpoint,
    sumCredentials,
    getExternalOutputSize,
    getOutputSize,
} from '../clientUtils';
import { ActiveRound, ActiveRoundOptions, RegisteredAccount, DecomposedOutputs } from '../../types';

/**
 * RoundPhase: 2, step 1
 * Join all registered Credentials in to one
 */

const joinInputsCredentials = async (
    round: ActiveRound,
    utxos: RegisteredAccount['utxos'],
    options: ActiveRoundOptions,
) => {
    const { roundParameters } = round;
    const { signal, coordinatorUrl, middlewareUrl } = options;

    let amountCredentials = utxos[0].confirmedAmountCredentials!;
    let vsizeCredentials = utxos[0].confirmedVsizeCredentials!;

    if (utxos.length === 1) {
        return {
            amountCredentials,
            vsizeCredentials,
        };
    }

    for (let i = 1; i < utxos.length; i++) {
        const current = utxos[i];
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
    }

    return {
        amountCredentials,
        vsizeCredentials,
    };
};

const getOutputAmounts = async (
    round: ActiveRound,
    availableVsize: number,
    outputSize: number,
    options: ActiveRoundOptions,
) => {
    const { roundParameters } = round;
    const { signal, middlewareUrl } = options;

    const registeredInputs = getEvents('InputAdded', round.coinjoinState.events);
    const internalInputs = Object.values(round.accounts).flatMap(account => account.utxos);
    const internalAmounts: number[] = [];
    const externalAmounts: number[] = [];

    registeredInputs.forEach(i => {
        const isMine = internalInputs.find(utxo => compareOutpoint(utxo.outpoint, i.coin.outpoint));
        if (isMine) {
            internalAmounts.push(isMine.confirmedAmountCredentials![0].value);
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
    round: ActiveRound,
    _accounts: RegisteredAccount[],
    options: ActiveRoundOptions,
): Promise<DecomposedOutputs[]> => {
    // group utxos and output addresses by account
    // const groupedUtxos = round.utxos.reduce((response, utxo) => {
    //     // validate each utxo
    //     if (!utxo.confirmedAmountCredentials || !utxo.confirmedVsizeCredentials) {
    //         throw new Error(
    //             `Utxo ${utxo.outpoint} registered in round ${round.id} is missing confirmed credentials`,
    //         );
    //     }
    //     const account = accounts.find(account =>
    //         account.utxos.find(ut => ut.outpoint === utxo.outpoint),
    //     );
    //     if (!account)
    //         throw new Error(
    //             `Utxo ${utxo.outpoint} registered in round ${round.id} is not assigned to any account`,
    //         );

    //     if (!response[account.descriptor]) {
    //         response[account.descriptor] = {
    //             utxos: [],
    //             addresses: account.addresses,
    //         };
    //     }
    //     response[account.descriptor].utxos.push(utxo);
    //     return response;
    // }, {} as Record<string, GroupedUtxos>);

    // join registered credentials
    const joinedCredentials = await Promise.all(
        Object.values(round.accounts).map(account => {
            const outputSize = getOutputSize(account.type);
            options.log('joining credentials: ', account.utxos.length);
            return joinInputsCredentials(round, account.utxos, options).then(result => ({
                ...result,
                outputSize,
            }));
        }),
    );

    // decompose output amounts
    const outputAmounts = await Promise.all(
        joinedCredentials.map(({ vsizeCredentials, outputSize }) => {
            const availableVsize = sumCredentials(vsizeCredentials);
            return getOutputAmounts(round, availableVsize, outputSize, options);
        }),
    );

    // combine everything into DecomposedOutputs objects
    return Object.values(round.accounts).map((account, index) => {
        if (!joinedCredentials[index]) throw new Error(`Missing credentials at index ${index}`);
        if (!outputAmounts[index]) throw new Error(`Missing amounts at index ${index}`);
        return {
            ...joinedCredentials[index],
            addresses: account.addresses,
            amounts: outputAmounts[index],
        };
    });
};
