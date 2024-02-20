import { arrayShuffle } from '@trezor/utils';

import * as coordinator from '../coordinator';
import * as middleware from '../middleware';
import {
    getRoundEvents,
    compareOutpoint,
    getAffiliateRequest,
    scheduleDelay,
} from '../../utils/roundUtils';
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
import { SessionPhase, WabiSabiProtocolErrorCode } from '../../enums';
import { TX_SIGNING_DELAY } from '../../constants';

const getTransactionData = (
    round: CoinjoinRound,
    options: CoinjoinRoundOptions,
): CoinjoinTransactionData => {
    const registeredInputs = getRoundEvents('InputAdded', round.coinjoinState.Events);
    const registeredOutputs = mergePubkeys(
        getRoundEvents('OutputAdded', round.coinjoinState.Events),
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
        .sort((a, b) => sortInputs(a.Coin, b.Coin))
        .map(({ Coin, OwnershipProof }) => {
            const { index, hash } = readOutpoint(Coin.Outpoint);
            const internal = myInputsInRound.find(a => compareOutpoint(a.outpoint, Coin.Outpoint));
            const address = getAddressFromScriptPubKey(Coin.TxOut.ScriptPubKey, options.network);

            return {
                path: internal?.path,
                outpoint: internal?.outpoint || Coin.Outpoint, // NOTE: internal outpoints are in lowercase, coordinators in uppercase
                hash,
                index,
                amount: Coin.TxOut.Value,
                address,
                scriptPubKey: prefixScriptPubKey(Coin.TxOut.ScriptPubKey),
                ownershipProof: OwnershipProof,
                commitmentData: round.commitmentData,
            };
        });

    const outputs = registeredOutputs
        .sort((a, b) => sortOutputs(a.Output, b.Output))
        .map(({ Output }) => {
            const internalOutput = myOutputsInRound.find(
                o => Output.ScriptPubKey === o.scriptPubKey,
            );
            const address = getAddressFromScriptPubKey(Output.ScriptPubKey, options.network);

            return {
                path: internalOutput?.path,
                address,
                amount: Output.Value,
                scriptPubKey: prefixScriptPubKey(Output.ScriptPubKey),
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
                round.roundParameters.MaxSuggestedAmount,
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

const sendTxSignature = async (
    round: CoinjoinRound,
    resolvedTime: number,
    input: Alice,
    { signal, coordinatorUrl, logger }: CoinjoinRoundOptions,
) => {
    // if DelayTransactionSigning is set then start sending signatures **after** 50 seconds reduced by time spent on actual signing on the device.
    // time span for sending signatures is also 50 seconds.
    const roundSigningDelay = round.roundParameters.DelayTransactionSigning ? TX_SIGNING_DELAY : 0;
    const minimumDelay = roundSigningDelay - resolvedTime;
    const maximumDelay = minimumDelay + TX_SIGNING_DELAY;
    const delay = scheduleDelay(round.phaseDeadline - Date.now(), minimumDelay, maximumDelay);

    logger.info(
        `Sending signature of ~~${input.outpoint}~~ with delay ${delay}ms. Round signing delay: ${round.roundParameters.DelayTransactionSigning}`,
    );

    await coordinator
        .transactionSignature(round.id, input.witnessIndex!, input.witness!, {
            signal,
            baseUrl: coordinatorUrl,
            identity: input.outpoint, // NOTE: recycle input identity
            delay,
            deadline: round.phaseDeadline,
        })
        .catch(error => {
            if (
                error instanceof coordinator.WabiSabiProtocolException &&
                error.errorCode === WabiSabiProtocolErrorCode.WitnessAlreadyProvided
            ) {
                // there is a possibility that previous request timed out on the client side but was successfully received by coordinator
                // ignore this error... it shouldn't break the round
            } else {
                throw error;
            }
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
    const resolvedTime = Math.max(
        ...round.inputs.map(i => {
            const res = i.getResolvedRequest('signature');

            return res?.timestamp || 0;
        }),
    );

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
        await Promise.all(
            arrayShuffle(round.inputs).map(input =>
                sendTxSignature(round, resolvedTime, input, options),
            ),
        );

        round.signedSuccessfully();
        round.setSessionPhase(SessionPhase.AwaitingOtherSignatures);
        logger.info(`Round ${round.id} signed successfully`);
    } catch (error) {
        // NOTE: if anything goes wrong in this process this Round will be corrupted for all the users
        // registered inputs will probably be banned

        const sendTime = Date.now() - sendProcessStart;

        round.setSessionPhase(SessionPhase.SignatureFailed);
        logger.error(
            `Round signing failed. Resolved time ${resolvedTime}ms. Send time ${sendTime}ms. ${error.message}`,
        );

        round.inputs.forEach(input => input.setError(error));
    }

    return round;
};
