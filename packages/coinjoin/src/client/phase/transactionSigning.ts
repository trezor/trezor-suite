import * as coordinator from '../coordinator';
import {
    getEvents,
    mergePubkeys,
    sortInputs,
    sortOutputs,
    readOutpoint,
    compareOutpoint,
    prefixScriptPubKey,
    addressFromScriptPubKey,
} from '../clientUtils';
import type { Alice } from '../Alice';
import type { CoinjoinRound, CoinjoinRoundOptions } from '../CoinjoinRound';
import type { CoinjoinTransactionData } from '../../types';

const getTransactionData = async (
    round: CoinjoinRound,
    options: CoinjoinRoundOptions,
): Promise<CoinjoinTransactionData> => {
    const registeredInputs = getEvents('InputAdded', round.coinjoinState.events);
    const registeredOutputs = mergePubkeys(getEvents('OutputAdded', round.coinjoinState.events));
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
                ownershipProof: input.coin.ownershipProof,
                commitmentData: round.commitmentData,
            };
        });

    const outputs = registeredOutputs
        .sort((a, b) => sortOutputs(a.output, b.output))
        .map(({ output }) => {
            const internalOutput = myOutputsInRound.find(
                o => output.scriptPubKey === o.scriptPubKey,
            );
            const address = addressFromScriptPubKey(output.scriptPubKey);
            return {
                path: internalOutput?.path,
                address,
                amount: output.value,
            };
        });

    // TODO: should payment request amount (for each account is different) be calc. here or in suite?
    const paymentRequest = await coordinator.getPaymentRequest(
        options.coordinatorName,
        outputs.map(o => ({
            address: o.address,
            amount: o.amount,
        })),
        { signal: options.signal, baseUrl: options.coordinatorUrl },
    );

    return {
        inputs,
        outputs,
        paymentRequest,
    };
};

// TODO: delay + identity (recycle inputRegistration identities)
// TODO: notify wallet about success and create "pending account" state in suite
const sendTxSignature = async (
    round: CoinjoinRound,
    input: Alice,
    { signal, coordinatorUrl }: CoinjoinRoundOptions,
) => {
    await coordinator.transactionSignature(round.id, input.witnessIndex!, input.witness!, {
        signal,
        baseUrl: coordinatorUrl,
        identity: input.outpoint,
        delay: 0,
    });
    return input;
};

export const transactionSigning = async (
    round: CoinjoinRound,
    options: CoinjoinRoundOptions,
): Promise<CoinjoinRound> => {
    const inputsWithError = round.inputs.filter(input => input.error);
    if (inputsWithError.length > 0) {
        options.log('Trying to sign input with assigned error');
        return round;
    }

    try {
        const inputsWithoutWitness = round.inputs.filter(input => !input.witness);
        if (inputsWithoutWitness.length > 0) {
            const alreadyRequested = inputsWithoutWitness.find(input => input.requested);
            if (alreadyRequested) {
                options.log(
                    'Trying to sign but request was not fulfilled yet',
                    inputsWithoutWitness,
                );
                throw new Error('Wittiness not provided');
            }
            const transactionData = await getTransactionData(round, options);
            round.transactionData = transactionData;
            return round;
        }

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
        round.inputs.forEach(input =>
            input.setError(new Error(`transactionSigning failed: ${error.message}`)),
        );
    }

    options.log(`Round ${round.id} signed successfully`);
    return round;
};
