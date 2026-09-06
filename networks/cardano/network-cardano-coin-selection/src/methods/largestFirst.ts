import * as CardanoWasm from '@emurgo/cardano-serialization-lib-nodejs';

import { ERROR } from '../constants';
import {
    type ChangeOutput,
    type CoinSelectionParams,
    type CoinSelectionResult,
    type Options,
    type Output,
    type OutputCost,
    type Utxo,
} from '../types/types';
import {
    bigNumFromStr,
    buildTxInput,
    buildTxOutput,
    calculateRequiredDeposit,
    calculateUserOutputsFee,
    getAssetAmount,
    getInitialUtxoSet,
    getTxBuilder,
    getUnsatisfiedAssets,
    getUserOutputQuantityWithDeposit,
    multiAssetToArray,
    orderInputs,
    prepareCertificates,
    prepareChangeOutput,
    prepareWithdrawals,
    setMaxOutput,
    setMinUtxoValueForOutputs,
    sortUtxos,
    splitChangeOutput,
} from '../utils/common';
import { CoinSelectionError } from '../utils/errors';

export const largestFirst = (
    params: CoinSelectionParams,
    options?: Options,
): CoinSelectionResult => {
    const { utxos, outputs, changeAddress, certificates, withdrawals, accountPubKey, ttl } = params;
    const txBuilder = getTxBuilder(options?.feeParams?.a);
    if (ttl) {
        txBuilder.set_ttl(ttl);
    }

    const usedUtxos: Utxo[] = [];
    let sortedUtxos = sortUtxos(utxos);
    const accountKey = CardanoWasm.Bip32PublicKey.from_bytes(Buffer.from(accountPubKey, 'hex'));

    // add withdrawals and certs to correctly set a fee
    const preparedCertificates = prepareCertificates(certificates, accountKey);
    const preparedWithdrawals = prepareWithdrawals(withdrawals);

    if (preparedCertificates.len() > 0) {
        txBuilder.set_certs(preparedCertificates);
    }
    if (preparedWithdrawals.len() > 0) {
        txBuilder.set_withdrawals(preparedWithdrawals);
    }

    // TODO: negative value in case of deregistration (-2000000), but we still need enough utxos to cover fee which can't be (is that right?) paid from returned deposit
    const deposit = calculateRequiredDeposit(certificates);
    const totalWithdrawal = withdrawals.reduce(
        (acc, withdrawal) => acc.checked_add(bigNumFromStr(withdrawal.amount)),
        bigNumFromStr('0'),
    );

    // calc initial fee
    let totalFeesAmount = txBuilder.min_fee();
    let utxosTotalAmount = totalWithdrawal;
    if (deposit < 0) {
        // stake deregistration, 2 ADA returned
        utxosTotalAmount = utxosTotalAmount.checked_add(
            bigNumFromStr(Math.abs(deposit).toString()),
        );
    }

    const preparedOutputs = setMinUtxoValueForOutputs(txBuilder, outputs, changeAddress);

    const addUtxoToSelection = (utxo: Utxo) => {
        const { input, address, amount } = buildTxInput(utxo);
        const fee = txBuilder.fee_for_input(address, input, amount);
        txBuilder.add_regular_input(address, input, amount);
        usedUtxos.push(utxo);
        totalFeesAmount = totalFeesAmount.checked_add(fee);
        utxosTotalAmount = utxosTotalAmount.checked_add(bigNumFromStr(getAssetAmount(utxo)));
    };

    // set initial utxos set for setMax functionality
    const maxOutputIndex = outputs.findIndex(o => !!o.setMax);
    const maxOutput = preparedOutputs[maxOutputIndex];
    const { used, remaining } = getInitialUtxoSet(sortedUtxos, maxOutput);
    sortedUtxos = remaining;
    used.forEach(utxo => addUtxoToSelection(utxo));

    // add cost of external outputs to total fee amount
    totalFeesAmount = totalFeesAmount.checked_add(
        calculateUserOutputsFee(txBuilder, preparedOutputs, changeAddress),
    );

    let totalUserOutputsAmount = getUserOutputQuantityWithDeposit(preparedOutputs, deposit);

    let changeOutput: ChangeOutput[] | null = null;
    let sufficientUtxos = false;
    let forceAnotherRound = false;
    while (!sufficientUtxos) {
        if (maxOutput) {
            // Reset previously computed maxOutput in order to correctly calculate a potential change output
            // when new utxo is added to the set
            const [recalculatedMaxOutput] = setMinUtxoValueForOutputs(
                txBuilder,
                [maxOutput],
                changeAddress,
            );
            if (recalculatedMaxOutput) {
                preparedOutputs[maxOutputIndex] = recalculatedMaxOutput;
            }
        }

        // Calculate change output
        let singleChangeOutput: OutputCost | null = prepareChangeOutput(
            txBuilder,
            usedUtxos,
            preparedOutputs,
            changeAddress,
            utxosTotalAmount,
            getUserOutputQuantityWithDeposit(preparedOutputs, deposit),
            totalFeesAmount,
        );

        if (maxOutput) {
            // set amount for a max output from a changeOutput calculated above
            const { maxOutput: newMaxOutput } = setMaxOutput(
                txBuilder,
                maxOutput,
                singleChangeOutput,
            );

            // change output may be completely removed if all ADA are consumed by max output
            preparedOutputs[maxOutputIndex] = newMaxOutput;
            // recalculate  total user outputs amount
            totalUserOutputsAmount = getUserOutputQuantityWithDeposit(preparedOutputs, deposit);

            // recalculate fees for outputs as cost for max output may be larger than before
            totalFeesAmount = txBuilder
                .min_fee()
                .checked_add(calculateUserOutputsFee(txBuilder, preparedOutputs, changeAddress));

            // recalculate change after setting amount to max output
            singleChangeOutput = prepareChangeOutput(
                txBuilder,
                usedUtxos,
                preparedOutputs,
                changeAddress,
                utxosTotalAmount,
                getUserOutputQuantityWithDeposit(preparedOutputs, deposit),
                totalFeesAmount,
            );
        }

        const changeOutputs = singleChangeOutput
            ? splitChangeOutput(
                  txBuilder,
                  singleChangeOutput,
                  changeAddress,
                  options?._maxTokensPerOutput,
              )
            : [];

        let requiredAmount = totalFeesAmount.checked_add(totalUserOutputsAmount);
        changeOutputs.forEach(change => {
            // we need to cover amounts and fees for change outputs
            requiredAmount = requiredAmount
                .checked_add(change.output.amount().coin())
                .checked_add(change.outputFee);
        });

        // List of tokens for which we don't have enough utxos
        const unsatisfiedAssets = getUnsatisfiedAssets(usedUtxos, preparedOutputs);

        if (
            utxosTotalAmount.compare(requiredAmount) >= 0 &&
            unsatisfiedAssets.length === 0 &&
            usedUtxos.length > 0 && // TODO: force at least 1 utxo, otherwise withdrawal tx is composed without utxo if rewards > tx cost
            !forceAnotherRound
        ) {
            // we are done. we have enough utxos to cover fees + minUtxoValue for each output. now we can add the cost of the change output to total fees
            if (changeOutputs.length > 0) {
                changeOutputs.forEach(change => {
                    totalFeesAmount = totalFeesAmount.checked_add(change.outputFee);
                });

                // set change output
                changeOutput = changeOutputs.map(change => ({
                    isChange: true,
                    amount: change.output.amount().coin().to_str(),
                    address: changeAddress,
                    assets: multiAssetToArray(change.output.amount().multiasset()),
                }));
            } else {
                if (sortedUtxos.length > 0) {
                    // In current iteration we don't have enough utxo to meet min utxo value for an output,
                    // but some utxos are still available, force adding another one in order to create a change output
                    forceAnotherRound = true;
                    continue;
                }

                // Change output would be inefficient., we can burn its value + fee we would pay for it
                const unspendableChangeAmount = utxosTotalAmount.clamped_sub(
                    totalFeesAmount.checked_add(totalUserOutputsAmount),
                );
                totalFeesAmount = totalFeesAmount.checked_add(unspendableChangeAmount);
            }
            sufficientUtxos = true;
        } else {
            if (unsatisfiedAssets.length > 0) {
                // TODO: https://github.com/Emurgo/cardano-serialization-lib/pull/264
                sortedUtxos = sortUtxos(sortedUtxos, unsatisfiedAssets[0]);
            } else {
                sortedUtxos = sortUtxos(sortedUtxos);
            }

            const utxo = sortedUtxos.shift();
            if (!utxo) break;
            addUtxoToSelection(utxo);
            forceAnotherRound = false;
        }
        // END LOOP
    }

    if (!sufficientUtxos) {
        throw new CoinSelectionError(ERROR.UTXO_BALANCE_INSUFFICIENT);
    }

    preparedOutputs.forEach(output => {
        const txOutput = buildTxOutput(output, changeAddress);
        txBuilder.add_output(txOutput);
    });

    const finalOutputs: Output[] = JSON.parse(JSON.stringify(preparedOutputs));
    if (changeOutput) {
        changeOutput.forEach(change => {
            finalOutputs.push(change);
            txBuilder.add_output(buildTxOutput(change, changeAddress));
        });
    }

    txBuilder.set_fee(totalFeesAmount);
    const txBody = txBuilder.build();

    const txHash = CardanoWasm.FixedTransaction.new_from_body_bytes(txBody.to_bytes())
        .transaction_hash()
        .to_hex();
    const txBodyHex = Buffer.from(txBody.to_bytes()).toString('hex');

    const totalSpent = totalUserOutputsAmount.checked_add(totalFeesAmount);

    // Set max property with the value of an output which has setMax=true
    let max: string | undefined;
    if (maxOutput) {
        const [maxOutputAsset] = maxOutput.assets;
        max = maxOutputAsset ? maxOutputAsset.quantity : maxOutput.amount;
    }

    // reorder inputs to match order within tx
    const orderedInputs = orderInputs(usedUtxos, txBody);

    return {
        tx: { body: txBodyHex, hash: txHash, size: txBuilder.full_size() },
        inputs: orderedInputs,
        outputs: finalOutputs,
        fee: totalFeesAmount.to_str(),
        totalSpent: totalSpent.to_str(),
        deposit: deposit.toString(),
        withdrawal: totalWithdrawal.to_str(),
        ttl,
        max,
    };
};
