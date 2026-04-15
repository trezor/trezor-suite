import { arrayToDictionary, getWeakRandomId } from '@trezor/utils';

import type { CoinjoinRoundOptions, CoinjoinRoundShape } from '../../types/round';
import { getExternalOutputSize } from '../../utils/coordinatorUtils';
import { compareOutpoint, getRoundEvents, sumCredentials } from '../../utils/roundUtils';
import type { Account } from '../Account';
import * as coordinator from '../coordinator';
import * as middleware from '../middleware';

/**
 * RoundPhase: 2, step 1
 *
 * - Calculate output amounts
 * - Combine registered Credentials in to outputs grouped by accountKey
 */

interface GetOutputAmountsParams {
    round: CoinjoinRoundShape;
    options: CoinjoinRoundOptions;
    accountKey: string;
    availableVsize: number;
    inputSize: number;
    outputSize: number;
}

const getOutputAmounts = async (params: GetOutputAmountsParams) => {
    const { round, accountKey, outputSize, options } = params;
    const { roundParameters } = round;
    const { signal, middlewareUrl, logger } = options;

    const registeredInputs = getRoundEvents('InputAdded', round.coinjoinState.Events);
    const InternalAmounts: number[] = [];
    const ExternalAmounts: number[] = [];

    registeredInputs.forEach(i => {
        const internal = round.inputs.find(
            input =>
                input.accountKey === accountKey && compareOutpoint(input.outpoint, i.Coin.Outpoint),
        );
        if (internal) {
            // @ts-expect-error: indexing with noUncheckedIndexedAccess
            const firstCredential: middleware.Credentials = internal.confirmedAmountCredentials![0];
            InternalAmounts.push(firstCredential.Value);
        } else {
            const size = getExternalOutputSize(i.Coin.TxOut.ScriptPubKey);
            const miningFee = Math.floor((size * roundParameters.MiningFeeRate) / 1000);
            const coordinatorFee = Math.floor(
                roundParameters.CoordinationFeeRate.Rate * i.Coin.TxOut.Value,
            );
            ExternalAmounts.push(i.Coin.TxOut.Value - coordinatorFee - miningFee);
        }
    });
    logger.info(`Internal inputs: ${InternalAmounts.join(',')}`);
    logger.info(`External inputs: ${ExternalAmounts.join(',')}`);

    const outputAmounts = await middleware.getOutputsAmounts(
        {
            InputSize: params.inputSize,
            OutputSize: outputSize,
            AvailableVsize: params.availableVsize,
            MiningFeeRate: roundParameters.MiningFeeRate,
            AllowedOutputAmounts: roundParameters.AllowedOutputAmounts,
            InternalAmounts,
            ExternalAmounts,
        },
        { signal, baseUrl: middlewareUrl },
    );
    logger.info(`Decompose amounts: ${outputAmounts.join(',')}`);

    return outputAmounts.map(amount => {
        const miningFee = Math.floor((outputSize * roundParameters.MiningFeeRate) / 1000);
        const coordinatorFee = 0; // NOTE: middleware issue https://github.com/zkSNACKs/WalletWasabi/issues/8814 should be `amount > plebsDontPayThreshold ? Math.floor(roundParameters.coordinationFeeRate.rate * amount) : 0` but middleware does not considerate coordinationFeeRate and plebs for external amounts

        return amount + coordinatorFee + miningFee;
    });
};

interface CredentialIssuanceParams {
    round: CoinjoinRoundShape;
    amountToRequest: [number, number];
    vsizeToRequest: [number, number];
    amountCredentials: [middleware.Credentials, middleware.Credentials];
    vsizeCredentials: [middleware.Credentials, middleware.Credentials];
    options: CoinjoinRoundOptions;
}

// join or split Credentials to requested values
// returns new pairs of Credentials:
// `output` - what was requested
// `change` - whats left and could be used later
// both pairs contains [Value, ZeroValue]
const credentialIssuance = async (params: CredentialIssuanceParams) => {
    const { round, amountToRequest, amountCredentials, vsizeToRequest, vsizeCredentials } = params;
    const { roundParameters } = round;
    const { signal, coordinatorUrl, middlewareUrl, logger } = params.options;

    logger.info('Joining credentials');
    logger.info(
        `Amount ${amountCredentials.map(c => c.Value).join(',')} to ${amountToRequest.join(',')}`,
    );
    logger.info(
        `Vsize ${vsizeCredentials.map(c => c.Value).join(',')} to ${vsizeToRequest.join(',')}`,
    );

    // Credentials are always joined in pairs
    if (
        (!amountCredentials && !vsizeCredentials) ||
        (amountCredentials && amountCredentials.length < 2) ||
        (vsizeCredentials && vsizeCredentials.length < 2)
    )
        throw new Error('Not enough Credentials to join');

    const issuanceAmountCredentials = await middleware.getRealCredentials(
        amountToRequest,
        amountCredentials,
        round.amountCredentialIssuerParameters,
        roundParameters.MaxAmountCredentialValue,
        { signal, baseUrl: middlewareUrl },
    );
    const issuanceVsizeCredentials = await middleware.getRealCredentials(
        vsizeToRequest,
        vsizeCredentials,
        round.vsizeCredentialIssuerParameters,
        roundParameters.MaxVsizeCredentialValue,
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

    // use random identity for each request
    const issuanceData = await coordinator.credentialIssuance(
        round.id,
        issuanceAmountCredentials,
        issuanceVsizeCredentials,
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

    // create credentials for output
    const amountCredentialsOut = await middleware.getCredentials(
        round.amountCredentialIssuerParameters,
        issuanceData.RealAmountCredentials,
        issuanceAmountCredentials.CredentialsResponseValidation,
        { signal, baseUrl: middlewareUrl },
    );
    const vsizeCredentialsOut = await middleware.getCredentials(
        round.vsizeCredentialIssuerParameters,
        issuanceData.RealVsizeCredentials,
        issuanceVsizeCredentials.CredentialsResponseValidation,
        { signal, baseUrl: middlewareUrl },
    );

    // create zero credentials
    const zeroAmountCredentialsOut = await middleware.getCredentials(
        round.amountCredentialIssuerParameters,
        issuanceData.ZeroAmountCredentials,
        zeroAmountCredentials.CredentialsResponseValidation,
        { signal, baseUrl: middlewareUrl },
    );
    const zeroVsizeCredentialsOut = await middleware.getCredentials(
        round.vsizeCredentialIssuerParameters,
        issuanceData.ZeroVsizeCredentials,
        zeroVsizeCredentials.CredentialsResponseValidation,
        { signal, baseUrl: middlewareUrl },
    );

    // return pairs of new credentials
    // requested Credentials
    // @ts-expect-error: indexing with noUncheckedIndexedAccess
    const amountOut0: middleware.Credentials = amountCredentialsOut[0];
    // @ts-expect-error: indexing with noUncheckedIndexedAccess
    const zeroAmountOut0: middleware.Credentials = zeroAmountCredentialsOut[0];
    // @ts-expect-error: indexing with noUncheckedIndexedAccess
    const vsizeOut0: middleware.Credentials = vsizeCredentialsOut[0];
    // @ts-expect-error: indexing with noUncheckedIndexedAccess
    const zeroVsizeOut0: middleware.Credentials = zeroVsizeCredentialsOut[0];
    // @ts-expect-error: indexing with noUncheckedIndexedAccess
    const amountOut1: middleware.Credentials = amountCredentialsOut[1];
    // @ts-expect-error: indexing with noUncheckedIndexedAccess
    const zeroAmountOut1: middleware.Credentials = zeroAmountCredentialsOut[1];
    // @ts-expect-error: indexing with noUncheckedIndexedAccess
    const vsizeOut1: middleware.Credentials = vsizeCredentialsOut[1];
    // @ts-expect-error: indexing with noUncheckedIndexedAccess
    const zeroVsizeOut1: middleware.Credentials = zeroVsizeCredentialsOut[1];

    const output = {
        amountCredentials: [amountOut0, zeroAmountOut0],
        vsizeCredentials: [vsizeOut0, zeroVsizeOut0],
    };

    // or change output should be returned to pool
    // change Credentials
    const change = {
        amountCredentials: [amountOut1, zeroAmountOut1],
        vsizeCredentials: [vsizeOut1, zeroVsizeOut1],
    };

    logger.info(
        `Output amount credentials: ${output.amountCredentials.map(c => c.Value).join(',')}`,
    );
    logger.info(`Output vsize credentials: ${output.vsizeCredentials.map(c => c.Value).join(',')}`);
    logger.info(
        `Change amount credentials: ${change.amountCredentials.map(c => c.Value).join(',')}`,
    );
    logger.info(`Change vsize credentials: ${change.vsizeCredentials.map(c => c.Value).join(',')}`);

    return {
        output,
        change,
    };
};

const findCredentialsForTarget = (
    target: number,
    credentials: middleware.Credentials[],
    maxValue: number,
): [middleware.Credentials, middleware.Credentials] | undefined => {
    // sort descending. higher possibility for match
    const sorted = credentials.sort((a, b) => (a.Value > b.Value ? -1 : 1));

    // find one Credential big enough to cover requested target
    const bigCredential = sorted.find(cre => cre.Value >= target);
    if (bigCredential) {
        // try find a pair to produce change Credential used in next iteration
        // always try to pair with greatest Credential or at least 0 value Credential
        const changeValue = bigCredential.Value - target;
        const pair = sorted.find(
            cre => cre !== bigCredential && cre.Value + changeValue <= maxValue,
        );
        if (pair) {
            return [bigCredential, pair];
        }
        // this should never happen but just in case
        throw new Error('Missing pair for credential');
    }

    // one Credential is not enough. try to find pair to cover requested target
    const candidate = sorted
        .map((cre, index) => {
            // always try to pair with greatest Credential to produce greatest possible change
            const pair = sorted
                .slice(index + 1)
                .find(p => p.Value + cre.Value >= target && p.Value + cre.Value <= maxValue);

            if (pair) {
                return [cre, pair];
            }

            return [];
        })
        .find(pair => pair.length === 2);

    if (!candidate) return undefined;
    // @ts-expect-error: indexing with noUncheckedIndexedAccess
    const first: middleware.Credentials = candidate[0];
    // @ts-expect-error: indexing with noUncheckedIndexedAccess
    const second: middleware.Credentials = candidate[1];

    return [first, second];
};

export interface Bob {
    accountKey: string;
    amount: number;
    amountCredentials: middleware.Credentials[];
    vsizeCredentials: middleware.Credentials[];
}

interface CreateOutputsCredentials {
    round: CoinjoinRoundShape;
    options: CoinjoinRoundOptions;
    accountKey: string;
    outputSize: number;
    amounts: number[];
    amountCredentials: middleware.Credentials[];
    vsizeCredentials: middleware.Credentials[];
    result: Bob[];
}

const createOutputsCredentials = async (params: CreateOutputsCredentials): Promise<Bob[]> => {
    const { round, amounts, outputSize, amountCredentials, vsizeCredentials, options } = params;
    const { roundParameters } = round;

    // sort amounts ascending. smaller amounts should produce bigger change Credentials for next iteration
    const sorted = amounts.sort((a, b) => a - b);

    // try to find Credentials for each amount
    const amountsWithCredentials = sorted.map(amount => ({
        amount,
        credentials: findCredentialsForTarget(
            amount,
            amountCredentials,
            roundParameters.MaxAmountCredentialValue,
        ),
    }));

    // get first available set and spilt in to output and change
    const amountPair = amountsWithCredentials.find(c => c.credentials);
    const vsizePair = findCredentialsForTarget(
        outputSize,
        vsizeCredentials,
        round.roundParameters.MaxVsizeCredentialValue,
    );

    if (amountPair?.credentials && vsizePair) {
        const availableAmount = sumCredentials(amountPair.credentials);
        const availableVsize = sumCredentials(vsizePair);
        const joined = await credentialIssuance({
            ...params,
            amountToRequest: [amountPair.amount, availableAmount - amountPair.amount],
            amountCredentials: amountPair.credentials,
            vsizeToRequest: [outputSize, availableVsize - outputSize],
            vsizeCredentials: vsizePair,
        });

        // create Bob
        const result = params.result.concat([
            {
                accountKey: params.accountKey,
                amount: amountPair.amount,
                amountCredentials: joined.output.amountCredentials,
                vsizeCredentials: joined.output.vsizeCredentials,
            },
        ]);

        // remove amount from list
        const amountIndex = amounts.findIndex(a => a === amountPair.amount);
        const updatedAmounts = amounts.slice(0);
        updatedAmounts.splice(amountIndex, 1);

        // update credentials list:
        // - remove joined Credentials used by credentialIssuance process
        // - add **change** Credentials back to available stack
        const updatedAmountCredentials = amountCredentials
            .filter(cre => !amountPair.credentials?.includes(cre))
            .concat(joined.change.amountCredentials);
        const updatedVsizeCredentials = vsizeCredentials
            .filter(cre => !vsizePair.includes(cre))
            .concat(joined.change.vsizeCredentials);

        if (updatedAmounts.length === 0) {
            // no more amounts, check whats left
            const amountDust = sumCredentials(updatedAmountCredentials);
            const vsizeDust = sumCredentials(updatedVsizeCredentials);

            options.logger.info(`Amount dust: ${amountDust}`);
            options.logger.info(`Vsize dust: ${vsizeDust}`);
            options.logger.info('Decomposition completed');

            return result.sort((a, b) => (a.amount > b.amount ? -1 : 1));
        }

        // try to create another output
        return createOutputsCredentials({
            ...params,
            amounts: updatedAmounts,
            amountCredentials: updatedAmountCredentials,
            vsizeCredentials: updatedVsizeCredentials,
            result,
        });
    }

    const amountToJoin = findCredentialsForTarget(
        0,
        amountCredentials,
        roundParameters.MaxAmountCredentialValue,
    );
    const vsizeToJoin = findCredentialsForTarget(
        0,
        vsizeCredentials,
        roundParameters.MaxVsizeCredentialValue,
    );

    if (!amountToJoin || !vsizeToJoin) {
        // this should never happen but just in case
        throw new Error('Missing credentials to join');
    }

    const availableAmount = sumCredentials(amountToJoin);
    const availableVsize = sumCredentials(vsizeToJoin);
    const joined = await credentialIssuance({
        ...params,
        amountToRequest: [availableAmount, 0],
        amountCredentials: amountToJoin,
        vsizeToRequest: [availableVsize, 0],
        vsizeCredentials: vsizeToJoin,
    });

    // update credentials list:
    // - remove joined Credentials used by credentialIssuance process
    // - add **output** Credentials to available stack
    const updatedAmountCredentials = amountCredentials
        .filter(cre => !amountToJoin.includes(cre))
        .concat(joined.output.amountCredentials);
    const updatedVsizeCredentials = vsizeCredentials
        .filter(cre => !vsizeToJoin.includes(cre))
        .concat(joined.output.vsizeCredentials);

    // try again with updated Credentials
    return createOutputsCredentials({
        ...params,
        amountCredentials: updatedAmountCredentials,
        vsizeCredentials: updatedVsizeCredentials,
    });
};

export interface DecomposedOutputs {
    accountKey: string;
    outputs: Bob[];
}

export const outputDecomposition = async (
    round: CoinjoinRoundShape,
    accounts: Account[],
    options: CoinjoinRoundOptions,
): Promise<DecomposedOutputs[]> => {
    // group inputs by accountKeys
    const groupInputsByAccount = arrayToDictionary(
        round.inputs,
        input => {
            if (!input.confirmedAmountCredentials || !input.confirmedVsizeCredentials) {
                throw new Error(`Missing confirmed credentials for ~~${input.outpoint}~~`);
            }

            return input.accountKey;
        },
        true,
    );

    const { logger } = options;

    logger.info(`Decompose ${Object.keys(groupInputsByAccount).length} accounts`);

    // calculate amounts
    const outputAmounts = await Promise.all(
        Object.values(groupInputsByAccount).map(inputs => {
            // @ts-expect-error: indexing with noUncheckedIndexedAccess
            const firstInput: (typeof inputs)[number] = inputs[0];
            const { accountKey, inputSize, outputSize } = firstInput; // all inputs belongs to the same account (key, size)
            const allVsizeCredentials = inputs.flatMap(i => i.confirmedVsizeCredentials!);
            // limit available vsize if it's bigger than available change addresses
            // prevent from creating amounts which cannot be assigned to address
            const availableAddresses =
                accounts
                    .find(account => account.accountKey === accountKey)
                    ?.changeAddresses.filter(addr => !round.prison.isDetained(addr.address)) || [];
            const availableVsize = Math.min(
                sumCredentials(allVsizeCredentials),
                availableAddresses.length * outputSize,
            );

            return getOutputAmounts({
                round,
                accountKey,
                availableVsize,
                inputSize,
                outputSize,
                options,
            });
        }),
    );

    // join inputs Credentials for each account separately
    const joinedCredentials = await Promise.all(
        Object.keys(groupInputsByAccount).map((accountKey, index) => {
            // @ts-expect-error: indexing with noUncheckedIndexedAccess
            const amounts: number[] = outputAmounts[index];
            if (!amounts) throw new Error(`Missing amounts at index ${index}`);

            logger.info(`Create outputs: ${amounts.join(',')}`);
            // @ts-expect-error: indexing with noUncheckedIndexedAccess
            const inputs: (typeof groupInputsByAccount)[string] = groupInputsByAccount[accountKey];
            const amountCredentials = inputs.flatMap(i => i.confirmedAmountCredentials!);
            const vsizeCredentials = inputs.flatMap(i => i.confirmedVsizeCredentials!);
            // @ts-expect-error: indexing with noUncheckedIndexedAccess
            const firstInputForSize: (typeof inputs)[number] = inputs[0];
            const result = createOutputsCredentials({
                round,
                accountKey,
                outputSize: firstInputForSize.outputSize, // all inputs are using same script type (size),
                amounts,
                amountCredentials,
                vsizeCredentials,
                options,
                result: [],
            });

            return result;
        }),
    );

    // combine everything into DecomposedOutputs objects and return the result to outputRegistration
    return Object.keys(groupInputsByAccount).map((accountKey, index) => {
        // @ts-expect-error: indexing with noUncheckedIndexedAccess
        const outputs: Bob[] = joinedCredentials[index];
        if (!outputs) throw new Error(`Missing joined credentials at index ${index}`);

        return {
            accountKey,
            outputs,
        };
    });
};
