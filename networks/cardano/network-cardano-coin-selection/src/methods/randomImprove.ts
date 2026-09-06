import * as CardanoWasm from '@emurgo/cardano-serialization-lib-nodejs';

import { ERROR } from '../constants';
import {
    type CoinSelectionParams,
    type CoinSelectionResult,
    type Options,
    type Output,
    type OutputCost,
    type UserOutput,
    type Utxo,
} from '../types/types';
import {
    bigNumFromStr,
    buildTxInput,
    buildTxOutput,
    filterUtxos,
    getOutputQuantity,
    getRandomUtxo,
    getTxBuilder,
    getUnsatisfiedAssets,
    getUserOutputQuantityWithDeposit,
    getUtxoQuantity,
    multiAssetToArray,
    orderInputs,
    prepareChangeOutput,
    setMinUtxoValueForOutputs,
    splitChangeOutput,
} from '../utils/common';
import { CoinSelectionError } from '../utils/errors';
import { getLogger } from '../utils/logger';
// Heavily inspired by https://github.com/input-output-hk/cardano-js-sdk

const improvesSelection = (
    utxoAlreadySelected: Utxo[],
    input: Utxo,
    minimumTarget: CardanoWasm.BigNum,
    asset: string,
): boolean => {
    const oldQuantity = getUtxoQuantity(utxoAlreadySelected, asset);
    if (oldQuantity.compare(minimumTarget) < 0) return true;
    const newQuantity = oldQuantity.checked_add(getUtxoQuantity([input], asset));
    const idealTarget = minimumTarget.checked_mul(bigNumFromStr('2'));
    const newDistance =
        idealTarget.compare(newQuantity) > 0
            ? idealTarget.clamped_sub(newQuantity)
            : newQuantity.clamped_sub(idealTarget);
    const oldDistance =
        idealTarget.compare(oldQuantity) > 0
            ? idealTarget.clamped_sub(oldQuantity)
            : oldQuantity.clamped_sub(idealTarget);
    if (newDistance.compare(oldDistance) < 0) return true;

    return false;
};

const selection = (
    utxos: Utxo[],
    outputs: UserOutput[],
    txBuilder: CardanoWasm.TransactionBuilder,
    dummyAddress: string,
) => {
    const utxoSelected: Utxo[] = [];
    const utxoRemaining = JSON.parse(JSON.stringify(utxos)) as Utxo[];
    const preparedOutputs = setMinUtxoValueForOutputs(txBuilder, outputs, dummyAddress);
    preparedOutputs.forEach(output => {
        const txOutput = buildTxOutput(output, dummyAddress);
        txBuilder.add_output(txOutput);
    });
    // Check for UTXO_BALANCE_INSUFFICIENT comparing provided inputs with requested outputs
    const assetsRemaining = getUnsatisfiedAssets(utxoSelected, preparedOutputs);
    assetsRemaining.forEach(asset => {
        const outputQuantity = getOutputQuantity(preparedOutputs, asset);
        const utxosQuantity = getUtxoQuantity(utxos, asset);
        if (outputQuantity.compare(utxosQuantity) > 0) {
            throw new CoinSelectionError(ERROR.UTXO_BALANCE_INSUFFICIENT);
        }
    });

    while (assetsRemaining.length > 0) {
        assetsRemaining.forEach((asset, assetIndex) => {
            const assetUtxos = filterUtxos(utxoRemaining, asset);
            const inputIdx = Math.floor(Math.random() * assetUtxos.length);
            const utxo = assetUtxos[inputIdx];
            if (utxo) {
                if (
                    improvesSelection(
                        utxoSelected,
                        utxo,
                        getOutputQuantity(preparedOutputs, asset),
                        asset,
                    )
                ) {
                    utxoSelected.push(utxo);
                    const { input, address, amount } = buildTxInput(utxo);
                    txBuilder.add_regular_input(address, input, amount);
                    utxoRemaining.splice(utxoRemaining.indexOf(utxo), 1);
                } else {
                    assetsRemaining.splice(assetIndex, 1);
                }
            } else {
                assetsRemaining.splice(assetIndex, 1);
            }
        });
    }

    return { utxoSelected, utxoRemaining, preparedOutputs };
};

const calculateChange = (
    utxoSelected: Utxo[],
    utxoRemaining: Utxo[],
    preparedOutputs: UserOutput[],
    changeAddress: string,
    maxTokensPerOutput: number | undefined,
    txBuilder: CardanoWasm.TransactionBuilder,
): { changeOutputs: OutputCost[] } => {
    const totalFeesAmount = txBuilder.min_fee();
    const totalUserOutputsAmount = getUserOutputQuantityWithDeposit(preparedOutputs, 0);

    const singleChangeOutput = prepareChangeOutput(
        txBuilder,
        utxoSelected,
        preparedOutputs,
        changeAddress,
        getUtxoQuantity(utxoSelected, 'lovelace'),
        getUserOutputQuantityWithDeposit(preparedOutputs, 0),
        totalFeesAmount,
        () => getRandomUtxo(txBuilder, utxoRemaining, utxoSelected),
    );

    const changeOutputs = singleChangeOutput
        ? splitChangeOutput(txBuilder, singleChangeOutput, changeAddress, maxTokensPerOutput)
        : [];

    let requiredAmount = totalFeesAmount.checked_add(totalUserOutputsAmount);
    changeOutputs.forEach(changeOutput => {
        // we need to cover amounts and fees for change outputs
        requiredAmount = requiredAmount
            .checked_add(changeOutput.output.amount().coin())
            .checked_add(changeOutput.outputFee);
    });

    if (requiredAmount.compare(getUtxoQuantity(utxoSelected, 'lovelace')) > 0) {
        const randomUtxo = getRandomUtxo(txBuilder, utxoRemaining, utxoSelected);
        if (randomUtxo?.utxo) {
            randomUtxo.addUtxo();

            return calculateChange(
                utxoSelected,
                utxoRemaining,
                preparedOutputs,
                changeAddress,
                maxTokensPerOutput,
                txBuilder,
            );
        } else {
            throw new CoinSelectionError(ERROR.UTXO_BALANCE_INSUFFICIENT);
        }
    } else {
        return { changeOutputs };
    }
};

export const randomImprove = (
    params: Pick<CoinSelectionParams, 'utxos' | 'outputs' | 'changeAddress' | 'ttl'>,
    options?: Options,
): CoinSelectionResult => {
    const { utxos, outputs, changeAddress, ttl } = params;
    const logger = getLogger(!!options?.debug);
    if (outputs.length > utxos.length) {
        logger.debug(
            'There are more outputs than utxos. Random-improve alg needs to have number of utxos same or larger than number of outputs',
        );
        throw new CoinSelectionError(ERROR.UTXO_NOT_FRAGMENTED_ENOUGH);
    }
    const txBuilder = getTxBuilder(options?.feeParams?.a);
    if (ttl) {
        txBuilder.set_ttl(ttl);
    }

    const { utxoSelected, utxoRemaining, preparedOutputs } = selection(
        utxos,
        outputs,
        txBuilder,
        changeAddress,
    );

    // compute change and adjust for fee
    const { changeOutputs } = calculateChange(
        utxoSelected,
        utxoRemaining,
        preparedOutputs,
        changeAddress,
        options?._maxTokensPerOutput,
        txBuilder,
    );

    const finalOutputs: Output[] = JSON.parse(JSON.stringify(preparedOutputs));
    changeOutputs.forEach(change => {
        const ch = {
            isChange: true,
            amount: change.output.amount().coin().to_str(),
            address: changeAddress,
            assets: multiAssetToArray(change.output.amount().multiasset()),
        };
        finalOutputs.push(ch);
        txBuilder.add_output(buildTxOutput(ch, changeAddress));
    });

    const totalUserOutputsAmount = getUserOutputQuantityWithDeposit(preparedOutputs, 0);

    const totalInput = getUtxoQuantity(utxoSelected, 'lovelace');
    const totalOutput = getOutputQuantity(finalOutputs, 'lovelace');
    const fee = totalInput.checked_sub(totalOutput);
    const totalSpent = totalUserOutputsAmount.checked_add(fee);

    txBuilder.set_fee(fee);
    const txBody = txBuilder.build();
    const txHash = CardanoWasm.FixedTransaction.new_from_body_bytes(txBody.to_bytes())
        .transaction_hash()
        .to_hex();
    const txBodyHex = Buffer.from(txBody.to_bytes()).toString('hex');

    // reorder inputs to match order within tx
    const orderedInputs = orderInputs(utxoSelected, txBody);

    return {
        tx: { body: txBodyHex, hash: txHash, size: txBuilder.full_size() },
        inputs: orderedInputs,
        outputs: finalOutputs,
        fee: fee.to_str(),
        totalSpent: totalSpent.to_str(),
        deposit: '0',
        withdrawal: '0',
        ttl,
    };
};
