import * as coordinator from '../coordinator';
import {
    getEvents,
    mergePubkeys,
    sortInputs,
    sortOutputs,
    readOutpoint,
    compareOutpoint,
    updateAccountsUtxos,
    prefixScriptPubKey,
    addressFromScriptPubKey,
} from '../clientUtils';
import {
    ActiveRound,
    ActiveRoundOptions,
    RegisteredAccountUtxo,
    TransactionData,
} from '../../types';

const getTransactionData = async (
    round: ActiveRound,
    options: ActiveRoundOptions,
): Promise<TransactionData> => {
    const registeredInputs = getEvents('InputAdded', round.coinjoinState.events);
    const registeredOutputs = mergePubkeys(getEvents('OutputAdded', round.coinjoinState.events));
    const myInputsInRound = Object.values(round.accounts).flatMap(account => account.utxos);
    const myOutputsInRound = Object.values(round.accounts).flatMap(account => account.addresses);

    if (myOutputsInRound.length < 1) {
        throw new Error(`No registered outputs for round ${round.id}`);
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
    round: ActiveRound,
    utxo: RegisteredAccountUtxo,
    { signal, coordinatorUrl }: ActiveRoundOptions,
) => {
    await coordinator.transactionSignature(round.id, utxo.witnessIndex!, utxo.witness!, {
        signal,
        baseUrl: coordinatorUrl,
        identity: utxo.outpoint,
        delay: 0,
    });
    return utxo;
};

export const transactionSigning = async (
    round: ActiveRound,
    options: ActiveRoundOptions,
): Promise<ActiveRound> => {
    const utxosToSign = Object.values(round.accounts).flatMap(account => account.utxos);
    const inputsWithError = utxosToSign.filter(utxo => utxo.error);
    if (inputsWithError.length > 0) {
        options.log('trying to sign utxo with assigned error');
        return round;
    }

    const inputsWithoutWitness = utxosToSign.filter(utxos => !utxos.witness);
    if (inputsWithoutWitness.length > 0) {
        const alreadyRequested = inputsWithoutWitness.find(utxo => utxo.requested === 'witness');
        if (alreadyRequested) {
            options.log('Trying to sign but request was not fulfilled yet', inputsWithoutWitness);
            throw new Error('Wittiness not provided');
        }
        const transactionData = await getTransactionData(round, options);
        return {
            ...round,
            transactionData,
            accounts: updateAccountsUtxos(
                round.accounts,
                utxosToSign.map(utxo => {
                    const req = inputsWithoutWitness.find(i => i.outpoint === utxo.outpoint);
                    if (req) {
                        return {
                            ...utxo,
                            requested: 'witness',
                        };
                    }
                    return utxo;
                }),
            ),
        };
    }

    const signedUtxos = await Promise.allSettled(
        utxosToSign.map(utxo => sendTxSignature(round, utxo, options)),
    ).then(result =>
        result.map((r, i) =>
            r.status === 'fulfilled' ? r.value : { ...utxosToSign[i], error: r.reason },
        ),
    );
    options.log(`Round ${round.id} signed successfully`);
    return {
        ...round,
        accounts: updateAccountsUtxos(round.accounts, signedUtxos),
    };
};
