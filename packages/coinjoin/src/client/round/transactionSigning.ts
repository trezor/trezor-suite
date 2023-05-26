import * as coordinator from '../coordinator';
import * as middleware from '../middleware';
import { getRoundEvents, compareOutpoint, getAffiliateRequest } from '../../utils/roundUtils';
import {
    mergePubkeys,
    sortInputs,
    sortOutputs,
    readOutpoint,
    prefixScriptPubKey,
    getAddressFromScriptPubKey,
} from '../../utils/coordinatorUtils';
import type { Account } from '../Account';
import type { Alice } from '../Alice';
import type { CoinjoinRound, CoinjoinRoundOptions } from '../CoinjoinRound';
import { CoinjoinTransactionData } from '../../types';
import { SessionPhase } from '../../enums';

const getTransactionData = (
    round: CoinjoinRound,
    options: CoinjoinRoundOptions,
): CoinjoinTransactionData => {
    const registeredInputs = getRoundEvents('InputAdded', round.coinjoinState.events);
    const registeredOutputs = mergePubkeys(
        getRoundEvents('OutputAdded', round.coinjoinState.events),
    );
    const myInputsInRound = round.inputs;
    const myOutputsInRound = round.addresses;

    if (!myOutputsInRound || myOutputsInRound.length < 1) {
        throw new Error(`No registered outputs for round ${round.id}`);
    }

    if (registeredInputs.length < myInputsInRound.length) {
        throw new Error(`Inconsistent data. Unexpected sum of registered inputs.`);
    }

    if (registeredOutputs.length < myOutputsInRound.length) {
        throw new Error(`Inconsistent data. Unexpected sum of registered outputs.`);
    }

    const inputs = registeredInputs
        .sort((a, b) => sortInputs(a.coin, b.coin))
        .map(({ coin, ownershipProof }) => {
            const { index, hash } = readOutpoint(coin.outpoint);
            const internal = myInputsInRound.find(a => compareOutpoint(a.outpoint, coin.outpoint));
            const address = getAddressFromScriptPubKey(coin.txOut.scriptPubKey, options.network);
            return {
                path: internal?.path,
                outpoint: internal?.outpoint || coin.outpoint, // NOTE: internal outpoints are in lowercase, coordinators in uppercase
                hash,
                index,
                amount: coin.txOut.value,
                address,
                scriptPubKey: prefixScriptPubKey(coin.txOut.scriptPubKey),
                ownershipProof,
                commitmentData: round.commitmentData,
            };
        });

    const outputs = registeredOutputs
        .sort((a, b) => sortOutputs(a.output, b.output))
        .map(({ output }) => {
            const internalOutput = myOutputsInRound.find(
                o => output.scriptPubKey === o.scriptPubKey,
            );
            const address = getAddressFromScriptPubKey(output.scriptPubKey, options.network);
            return {
                path: internalOutput?.path,
                address,
                amount: output.value,
                scriptPubKey: prefixScriptPubKey(output.scriptPubKey),
            };
        });

    return {
        inputs,
        outputs,
        affiliateRequest: getAffiliateRequest(round.roundParameters, round.affiliateRequest),
    };
};

const updateRawLiquidityClue = async (
    round: CoinjoinRound,
    accounts: Account[],
    tx: CoinjoinTransactionData,
    options: CoinjoinRoundOptions,
) => {
    const result = await Promise.all(
        accounts.map(account => {
            const externalAmounts = tx.outputs
                .filter(o => !account.changeAddresses.find(addr => addr.address === o.address))
                .map(o => o.amount);
            return middleware.updateLiquidityClue(
                account.rawLiquidityClue,
                round.roundParameters.maxSuggestedAmount,
                externalAmounts,
                { baseUrl: options.middlewareUrl },
            );
        }),
    );

    return accounts.map((account, index) => {
        const rawLiquidityClue = result[index];
        // NOTE: immediately update new value in Account
        // it's intentionally not updated by `updateAccount` to prevent race conditions
        account.updateRawLiquidityClue(rawLiquidityClue);

        return {
            accountKey: account.accountKey,
            rawLiquidityClue,
        };
    });
};

// TODO: delay
// TODO: notify wallet about success and create "pending account" state in suite
const sendTxSignature = async (
    round: CoinjoinRound,
    input: Alice,
    { signal, coordinatorUrl }: CoinjoinRoundOptions,
) => {
    await coordinator.transactionSignature(round.id, input.witnessIndex!, input.witness!, {
        signal,
        baseUrl: coordinatorUrl,
        identity: input.outpoint, // NOTE: recycle input identity
        delay: 0,
        deadline: round.phaseDeadline,
    });
    return input;
};

export const transactionSigning = async (
    round: CoinjoinRound,
    accounts: Account[],
    options: CoinjoinRoundOptions,
): Promise<CoinjoinRound> => {
    const { logger } = options;

    logger.info(`transactionSigning: ~~${round.id}~~`);

    const inputsWithError = round.inputs.filter(input => input.error);
    if (inputsWithError.length > 0) {
        inputsWithError.forEach(input => {
            logger.error(`Trying to sign input with assigned error ${input.error?.message}`);
        });
        return round;
    }

    const alreadyRequested = round.inputs.some(input => input.requested?.type === 'signature');
    if (alreadyRequested) {
        logger.error(`Signature request was not fulfilled`);
        return round;
    }

    if (!round.affiliateRequest) {
        logger.warn(`Missing affiliate request. Waiting for status`);
        round.setSessionPhase(SessionPhase.AwaitingCoinjoinTransaction);
        round.transactionSignTries.push(Date.now());
        return round;
    }

    const sendProcessStart = Date.now();

    try {
        const inputsWithoutWitness = round.inputs.filter(input => !input.witness);
        if (inputsWithoutWitness.length > 0) {
            round.setSessionPhase(SessionPhase.AwaitingCoinjoinTransaction);
            const transactionData = getTransactionData(round, options);
            const liquidityClues = await updateRawLiquidityClue(
                round,
                accounts,
                transactionData,
                options,
            );
            round.transactionData = transactionData;
            round.liquidityClues = liquidityClues;
            return round;
        }

        round.setSessionPhase(SessionPhase.SendingSignature);

        await Promise.all(round.inputs.map(input => sendTxSignature(round, input, options)));

        round.signedSuccessfully();
        round.setSessionPhase(SessionPhase.AwaitingOtherSignatures);
        logger.info(`Round ${round.id} signed successfully`);
    } catch (error) {
        // NOTE: if anything goes wrong in this process this Round will be corrupted for all the users
        // registered inputs will probably be banned
        const resolvedTime = Math.max(
            ...round.inputs.map(i => {
                const res = i.getResolvedRequest('signature');
                return res?.timestamp || 0;
            }),
        );

        const sendTime = Date.now() - sendProcessStart;

        round.setSessionPhase(SessionPhase.SignatureFailed);
        logger.error(
            `Round signing failed. Resolved time ${resolvedTime}ms. Send time ${sendTime}ms. ${error.message}`,
        );

        round.inputs.forEach(input => input.setError(error));
    }

    return round;
};
