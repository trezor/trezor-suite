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
        .map(input => {
            const { index, hash } = readOutpoint(input.coin.outpoint);
            const internal = myInputsInRound.find(a =>
                compareOutpoint(a.outpoint, input.coin.outpoint),
            );

            return {
                path: internal?.path,
                outpoint: internal?.outpoint || input.coin.outpoint, // NOTE: internal outpoints are in lowercase, coordinators in uppercase
                hash,
                index,
                amount: input.coin.txOut.value,
                scriptPubKey: prefixScriptPubKey(input.coin.txOut.scriptPubKey),
                ownershipProof: input.ownershipProof,
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
        affiliateRequest: getAffiliateRequest(round.affiliateRequest),
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
    const inputsWithError = round.inputs.filter(input => input.error);
    if (inputsWithError.length > 0) {
        options.log('Trying to sign input with assigned error');
        return round;
    }

    if (!round.affiliateRequest) {
        options.log('Trying to sign without affiliate request. Waiting for status');
        round.setSessionPhase(SessionPhase.AwaitingCoinjoinTransaction);
        return round;
    }

    try {
        const inputsWithoutWitness = round.inputs.filter(input => !input.witness);
        if (inputsWithoutWitness.length > 0) {
            const alreadyRequested = inputsWithoutWitness.find(input => input.requested);
            if (alreadyRequested) {
                options.log(
                    `Trying to sign but request was not fulfilled yet ${inputsWithoutWitness.length}`,
                );
                throw new Error('Wittiness not provided');
            }

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
        await Promise.allSettled(
            round.inputs.map(input => sendTxSignature(round, input, options)),
        ).then(result =>
            result.forEach((r, i) => {
                if (r.status !== 'fulfilled') {
                    round.inputs[i].setError(r.reason);
                }
            }),
        );
    } catch (error) {
        // NOTE: if anything goes wrong in this process this Round will be corrupted for all the users
        // registered inputs will probably be banned
        round.setSessionPhase(SessionPhase.SignatureFailed);

        round.inputs.forEach(input =>
            input.setError(new Error(`transactionSigning failed: ${error.message}`)),
        );
    }

    round.setSessionPhase(SessionPhase.AwaitingOtherSignatures);
    options.log(`Round ${round.id} signed successfully`);
    return round;
};
