import * as CardanoWasm from '@emurgo/cardano-serialization-lib-nodejs';

import {
    CARDANO_PARAMS,
    CertificateType,
    DATA_COST_PER_UTXO_BYTE,
    ERROR,
    MAX_TOKENS_PER_OUTPUT,
} from '../constants';
import { CoinSelectionError } from './errors';
import {
    type Asset,
    CardanoDRepType,
    type Certificate,
    type ChangeOutput,
    type Output,
    type OutputCost,
    type UserOutput,
    type Utxo,
    type Withdrawal,
} from '../types/types';

export const bigNumFromStr = (num: string): CardanoWasm.BigNum => CardanoWasm.BigNum.from_str(num);

export const getProtocolMagic = (
    tesnet?: boolean,
):
    | (typeof CARDANO_PARAMS.PROTOCOL_MAGICS)['mainnet']
    | (typeof CARDANO_PARAMS.PROTOCOL_MAGICS)['testnet_preview']
    | (typeof CARDANO_PARAMS.PROTOCOL_MAGICS)['testnet_preprod'] =>
    tesnet
        ? CARDANO_PARAMS.PROTOCOL_MAGICS.testnet_preview
        : CARDANO_PARAMS.PROTOCOL_MAGICS.mainnet;

export const getNetworkId = (
    testnet?: boolean,
):
    | (typeof CARDANO_PARAMS.NETWORK_IDS)['mainnet']
    | (typeof CARDANO_PARAMS.NETWORK_IDS)['testnet_preprod']
    | (typeof CARDANO_PARAMS.NETWORK_IDS)['testnet_preview'] =>
    testnet ? CARDANO_PARAMS.NETWORK_IDS.testnet_preview : CARDANO_PARAMS.NETWORK_IDS.mainnet;

export const parseAsset = (
    hex: string,
): {
    policyId: string;
    assetNameInHex: string;
} => {
    const policyIdSize = 56;
    const policyId = hex.slice(0, policyIdSize);
    const assetNameInHex = hex.slice(policyIdSize);

    return {
        policyId,
        assetNameInHex,
    };
};

export const buildMultiAsset = (assets: Asset[]): CardanoWasm.MultiAsset => {
    const multiAsset = CardanoWasm.MultiAsset.new();
    const assetsGroupedByPolicy: {
        [policyId: string]: CardanoWasm.Assets;
    } = {};
    assets.forEach(assetEntry => {
        const { policyId, assetNameInHex } = parseAsset(assetEntry.unit);
        if (!assetsGroupedByPolicy[policyId]) {
            assetsGroupedByPolicy[policyId] = CardanoWasm.Assets.new();
        }
        const policyAssets = assetsGroupedByPolicy[policyId];
        policyAssets.insert(
            CardanoWasm.AssetName.new(Buffer.from(assetNameInHex, 'hex')),
            bigNumFromStr(assetEntry.quantity || '0'), // fallback for an empty string
        );
    });

    Object.entries(assetsGroupedByPolicy).forEach(([policyId, policyAssets]) => {
        const scriptHash = CardanoWasm.ScriptHash.from_bytes(Buffer.from(policyId, 'hex'));
        multiAsset.insert(scriptHash, policyAssets);
    });

    return multiAsset;
};

export const multiAssetToArray = (multiAsset: CardanoWasm.MultiAsset | undefined): Asset[] => {
    if (!multiAsset) return [];
    const assetsArray: Asset[] = [];
    const policyHashes = multiAsset.keys();

    for (let i = 0; i < policyHashes.len(); i++) {
        const policyId = policyHashes.get(i);
        const assetsInPolicy = multiAsset.get(policyId);
        if (!assetsInPolicy) continue;

        const assetNames = assetsInPolicy.keys();
        for (let j = 0; j < assetNames.len(); j++) {
            const assetName = assetNames.get(j);
            const amount = assetsInPolicy.get(assetName);
            if (!amount) continue;

            const policyIdHex = Buffer.from(policyId.to_bytes()).toString('hex');
            const assetNameHex = Buffer.from(assetName.name()).toString('hex');

            assetsArray.push({
                quantity: amount.to_str(),
                unit: `${policyIdHex}${assetNameHex}`,
            });
        }
    }

    return assetsArray;
};

export const getAssetAmount = (obj: Pick<Utxo, 'amount'>, asset = 'lovelace'): string =>
    obj.amount.find(a => a.unit === asset)?.quantity ?? '0';

export const getUtxoQuantity = (utxos: Utxo[], asset = 'lovelace'): CardanoWasm.BigNum =>
    utxos.reduce(
        (acc, utxo) => acc.checked_add(bigNumFromStr(getAssetAmount(utxo, asset))),
        bigNumFromStr('0'),
    );

export const getOutputQuantity = (outputs: Output[], asset = 'lovelace'): CardanoWasm.BigNum => {
    if (asset === 'lovelace') {
        return outputs.reduce(
            (acc, output) => acc.checked_add(bigNumFromStr(output.amount ?? '0')),
            bigNumFromStr('0'),
        );
    }

    return outputs.reduce(
        (acc, output) =>
            acc.checked_add(
                bigNumFromStr(output.assets?.find(a => a.unit === asset)?.quantity ?? '0'),
            ),
        bigNumFromStr('0'),
    );
};

export const sortUtxos = (utxos: Utxo[], asset = 'lovelace'): Utxo[] => {
    const copy: Utxo[] = JSON.parse(JSON.stringify(utxos));

    return copy.sort((u1, u2) =>
        bigNumFromStr(getAssetAmount(u2, asset)).compare(bigNumFromStr(getAssetAmount(u1, asset))),
    );
};

export const buildTxInput = (
    utxo: Utxo,
): {
    input: CardanoWasm.TransactionInput;
    address: CardanoWasm.Address;
    amount: CardanoWasm.Value;
} => {
    const input = CardanoWasm.TransactionInput.new(
        CardanoWasm.TransactionHash.from_bytes(Buffer.from(utxo.txHash, 'hex')),
        utxo.outputIndex,
    );

    const amount = CardanoWasm.Value.new(bigNumFromStr(getAssetAmount(utxo)));
    const assets = utxo.amount.filter(a => a.unit !== 'lovelace');
    if (assets.length > 0) {
        const multiAsset = buildMultiAsset(assets);
        amount.set_multiasset(multiAsset);
    }

    const address = CardanoWasm.Address.from_bech32(utxo.address);

    return { input, address, amount };
};

export const buildTxOutput = (
    output: Output,
    dummyAddress: string,
): CardanoWasm.TransactionOutput => {
    // If output.address was not defined fallback to bech32 address (useful for "precompose" tx
    // which doesn't have all necessary data, but we can fill in the blanks and return some info such as fee)
    const outputAddr =
        output.address && CardanoWasm.ByronAddress.is_valid(output.address)
            ? CardanoWasm.ByronAddress.from_base58(output.address).to_address()
            : CardanoWasm.Address.from_bech32(output.address ?? dummyAddress);

    // Set initial amount
    const outputAmount = output.amount ? bigNumFromStr(output.amount) : bigNumFromStr('0');

    // Create Value including assets
    let outputValue = CardanoWasm.Value.new(outputAmount);
    const multiAsset = output.assets.length > 0 ? buildMultiAsset(output.assets) : null;
    if (multiAsset) {
        outputValue.set_multiasset(multiAsset);
    }

    // Calculate min required ADA for the output
    let txOutput = CardanoWasm.TransactionOutput.new(outputAddr, outputValue);
    const minAdaRequired = CardanoWasm.min_ada_for_output(txOutput, DATA_COST_PER_UTXO_BYTE);

    // If calculated min required ada is greater than current output value than adjust it
    if (outputAmount.compare(minAdaRequired) < 0) {
        outputValue = CardanoWasm.Value.new(minAdaRequired);
        if (multiAsset) {
            outputValue.set_multiasset(multiAsset);
        }
        txOutput = CardanoWasm.TransactionOutput.new(outputAddr, outputValue);
    }

    return txOutput;
};

export const getOutputCost = (
    txBuilder: CardanoWasm.TransactionBuilder,
    output: Output,
    dummyAddress: string,
): OutputCost => {
    const txOutput = buildTxOutput(output, dummyAddress);
    const outputFee = txBuilder.fee_for_output(txOutput);
    const minAda = CardanoWasm.min_ada_for_output(txOutput, DATA_COST_PER_UTXO_BYTE);

    return {
        output: txOutput,
        outputFee,
        minOutputAmount: minAda, // should match https://cardano-ledger.readthedocs.io/en/latest/explanations/min-utxo.html
    };
};

export const prepareWithdrawals = (withdrawals: Withdrawal[]): CardanoWasm.Withdrawals => {
    const preparedWithdrawals = CardanoWasm.Withdrawals.new();

    withdrawals.forEach(withdrawal => {
        const rewardAddress = CardanoWasm.RewardAddress.from_address(
            CardanoWasm.Address.from_bech32(withdrawal.stakeAddress),
        );

        if (rewardAddress) {
            preparedWithdrawals.insert(rewardAddress, bigNumFromStr(withdrawal.amount));
        }
    });

    return preparedWithdrawals;
};

export const prepareCertificates = (
    certificates: Certificate[],
    accountKey: CardanoWasm.Bip32PublicKey,
): CardanoWasm.Certificates => {
    const preparedCertificates = CardanoWasm.Certificates.new();
    if (certificates.length === 0) return preparedCertificates;

    const stakeKey = accountKey.derive(2).derive(0);
    const stakeCred = CardanoWasm.Credential.from_keyhash(stakeKey.to_raw_key().hash());

    certificates.forEach(cert => {
        if (cert.type === CertificateType.STAKE_REGISTRATION) {
            preparedCertificates.add(
                CardanoWasm.Certificate.new_stake_registration(
                    CardanoWasm.StakeRegistration.new(stakeCred),
                ),
            );
        } else if (cert.type === CertificateType.STAKE_DELEGATION) {
            preparedCertificates.add(
                CardanoWasm.Certificate.new_stake_delegation(
                    CardanoWasm.StakeDelegation.new(
                        stakeCred,
                        CardanoWasm.Ed25519KeyHash.from_bytes(Buffer.from(cert.pool, 'hex')),
                    ),
                ),
            );
        } else if (cert.type === CertificateType.STAKE_DEREGISTRATION) {
            preparedCertificates.add(
                CardanoWasm.Certificate.new_stake_deregistration(
                    CardanoWasm.StakeDeregistration.new(stakeCred),
                ),
            );
        } else if (cert.type === CertificateType.VOTE_DELEGATION) {
            let targetDRep: CardanoWasm.DRep;
            switch (cert.dRep.type) {
                case CardanoDRepType.ABSTAIN:
                    targetDRep = CardanoWasm.DRep.new_always_abstain();
                    break;
                case CardanoDRepType.NO_CONFIDENCE:
                    targetDRep = CardanoWasm.DRep.new_always_no_confidence();
                    break;
                case CardanoDRepType.KEY_HASH:
                    targetDRep = CardanoWasm.DRep.new_key_hash(
                        CardanoWasm.Ed25519KeyHash.from_hex(cert.dRep.keyHash),
                    );
                    break;
                case CardanoDRepType.SCRIPT_HASH:
                    targetDRep = CardanoWasm.DRep.new_script_hash(
                        CardanoWasm.ScriptHash.from_hex(cert.dRep.scriptHash),
                    );
                    break;
            }

            if (targetDRep) {
                preparedCertificates.add(
                    CardanoWasm.Certificate.new_vote_delegation(
                        CardanoWasm.VoteDelegation.new(stakeCred, targetDRep),
                    ),
                );
            }
        } else {
            throw new CoinSelectionError(ERROR.UNSUPPORTED_CERTIFICATE_TYPE);
        }
    });

    return preparedCertificates;
};

export const calculateRequiredDeposit = (certificates: Certificate[]): number => {
    const CertificateDeposit = {
        [CertificateType.STAKE_DELEGATION]: 0,
        [CertificateType.VOTE_DELEGATION]: 0,
        [CertificateType.STAKE_POOL_REGISTRATION]: 500000000,
        [CertificateType.STAKE_REGISTRATION]: 2000000,
        [CertificateType.STAKE_DEREGISTRATION]: -2000000,
    } as const;

    return certificates.reduce((acc, cert) => acc + CertificateDeposit[cert.type], 0);
};

export const setMinUtxoValueForOutputs = (
    txBuilder: CardanoWasm.TransactionBuilder,
    outputs: UserOutput[],
    dummyAddress: string,
): UserOutput[] => {
    const preparedOutputs = outputs.map(output => {
        // sets minimal output ADA amount in case of multi-asset output
        const { minOutputAmount } = getOutputCost(txBuilder, output, dummyAddress);
        const outputAmount = bigNumFromStr(output.amount || '0');

        let amount: string | undefined;
        if (output.assets.length > 0 && outputAmount.compare(minOutputAmount) < 0) {
            // output with an asset(s) adjust minimum ADA to met network requirements
            amount = minOutputAmount.to_str();
        } else {
            amount = output.amount;
        }

        if (
            !output.setMax &&
            output.assets.length === 0 &&
            output.amount &&
            outputAmount.compare(minOutputAmount) < 0
        ) {
            // setMax outputs are zeroed below and outputs with assets get their ADA raised to the
            // minimum, so only a plain ADA amount the user typed too low is an error.
            throw new CoinSelectionError(ERROR.UTXO_VALUE_TOO_SMALL);
        }

        if (output.setMax) {
            // if setMax is active set initial value to 0
            const [firstAsset] = output.assets;
            if (firstAsset) {
                firstAsset.quantity = '0';
            } else {
                amount = '0';
            }
        }

        return {
            ...output,
            // if output contains assets make sure that minUtxoValue is at least minOutputAmount (even for output where we want to setMax)
            amount,
        } as UserOutput;
    });

    return preparedOutputs;
};

export const splitChangeOutput = (
    txBuilder: CardanoWasm.TransactionBuilder,
    singleChangeOutput: OutputCost,
    changeAddress: string,
    maxTokensPerOutput = MAX_TOKENS_PER_OUTPUT,
): OutputCost[] => {
    // TODO: https://github.com/Emurgo/cardano-serialization-lib/pull/236
    const multiAsset = singleChangeOutput.output.amount().multiasset();
    if (!multiAsset || (multiAsset && multiAsset.len() < maxTokensPerOutput)) {
        return [singleChangeOutput];
    }

    let lovelaceAvailable = singleChangeOutput.output
        .amount()
        .coin()
        .checked_add(singleChangeOutput.outputFee);

    const allAssets = multiAssetToArray(singleChangeOutput.output.amount().multiasset());
    const nAssetBundles = Math.ceil(allAssets.length / maxTokensPerOutput);

    const changeOutputs: ChangeOutput[] = [];
    // split change output to multiple outputs, where each bundle has maximum of maxTokensPerOutput assets
    for (let i = 0; i < nAssetBundles; i++) {
        const assetsBundle = allAssets.slice(i * maxTokensPerOutput, (i + 1) * maxTokensPerOutput);

        const outputValue = CardanoWasm.Value.new_from_assets(buildMultiAsset(assetsBundle));
        const txOutput = CardanoWasm.TransactionOutput.new(
            CardanoWasm.Address.from_bech32(changeAddress),
            outputValue,
        );

        const minAdaRequired = CardanoWasm.min_ada_for_output(txOutput, DATA_COST_PER_UTXO_BYTE);

        changeOutputs.push({
            isChange: true,
            address: changeAddress,
            amount: minAdaRequired.to_str(),
            assets: assetsBundle,
        });
    }

    const changeOutputsCost = changeOutputs.map((partialChange, i) => {
        let changeOutputCost = getOutputCost(txBuilder, partialChange, changeAddress);
        lovelaceAvailable = lovelaceAvailable.clamped_sub(
            bigNumFromStr(partialChange.amount).checked_add(changeOutputCost.outputFee),
        );

        if (i === changeOutputs.length - 1) {
            // add all unused ADA to the last change output
            let changeOutputAmount = lovelaceAvailable.checked_add(
                bigNumFromStr(partialChange.amount),
            );

            if (changeOutputAmount.compare(changeOutputCost.minOutputAmount) < 0) {
                // computed change amount would be below minUtxoValue
                // set change output amount to met minimum requirements for minUtxoValue
                changeOutputAmount = changeOutputCost.minOutputAmount;
            }
            partialChange.amount = changeOutputAmount.to_str();
            changeOutputCost = getOutputCost(txBuilder, partialChange, changeAddress);
        }

        return changeOutputCost;
    });

    return changeOutputsCost;
};

export const prepareChangeOutput = (
    txBuilder: CardanoWasm.TransactionBuilder,
    usedUtxos: Utxo[],
    preparedOutputs: Output[],
    changeAddress: string,
    utxosTotalAmount: CardanoWasm.BigNum,
    totalOutputAmount: CardanoWasm.BigNum,
    totalFeesAmount: CardanoWasm.BigNum,
    pickAdditionalUtxo?: () => ReturnType<typeof getRandomUtxo>,
): OutputCost | null => {
    // change output amount should be lowered by the cost of the change output (fee + minUtxoVal)
    // The cost will be subtracted once we calculate it.
    const placeholderChangeOutputAmount = utxosTotalAmount.clamped_sub(
        totalFeesAmount.checked_add(totalOutputAmount),
    );
    const uniqueAssets: string[] = [];
    usedUtxos.forEach(utxo => {
        const assets = utxo.amount.filter(a => a.unit !== 'lovelace');
        assets.forEach(asset => {
            if (!uniqueAssets.includes(asset.unit)) {
                uniqueAssets.push(asset.unit);
            }
        });
    });

    const changeOutputAssets = uniqueAssets
        .map(assetUnit => {
            const assetInputAmount = getUtxoQuantity(usedUtxos, assetUnit);
            const assetSpentAmount = getOutputQuantity(preparedOutputs, assetUnit);

            return {
                unit: assetUnit,
                quantity: assetInputAmount.clamped_sub(assetSpentAmount).to_str(),
            };
        })
        .filter(asset => asset.quantity !== '0');

    const changeOutputCost = getOutputCost(
        txBuilder,
        {
            address: changeAddress,
            amount: placeholderChangeOutputAmount.to_str(),
            assets: changeOutputAssets,
        },
        changeAddress,
    );

    // calculate change output amount as utxosTotalAmount - totalOutputAmount - totalFeesAmount - change output fee
    const totalSpent = totalOutputAmount
        .checked_add(totalFeesAmount)
        .checked_add(changeOutputCost.outputFee);
    let changeOutputAmount = utxosTotalAmount.clamped_sub(totalSpent);

    // Change carrying tokens is always needed; pure-ADA change only if it clears minUtxoValue.
    let isChangeOutputNeeded = false;
    if (
        changeOutputAssets.length > 0 ||
        changeOutputAmount.compare(changeOutputCost.minOutputAmount) >= 0
    ) {
        isChangeOutputNeeded = true;
    } else if (pickAdditionalUtxo && changeOutputAmount.compare(bigNumFromStr('5000')) >= 0) {
        // Above 0.005 ADA but under minUtxoValue: pull in another utxo and recompute.
        const utxo = pickAdditionalUtxo();
        if (utxo) {
            utxo.addUtxo();
            const newTotalFee = txBuilder.min_fee();

            return prepareChangeOutput(
                txBuilder,
                usedUtxos,
                preparedOutputs,
                changeAddress,
                getUtxoQuantity(usedUtxos, 'lovelace'),
                totalOutputAmount,
                newTotalFee,
                pickAdditionalUtxo,
            );
        }
    }

    if (isChangeOutputNeeded) {
        if (changeOutputAmount.compare(changeOutputCost.minOutputAmount) < 0) {
            // computed change amount would be below minUtxoValue
            // set change output amount to met minimum requirements for minUtxoValue
            changeOutputAmount = changeOutputCost.minOutputAmount;
        }

        // TODO: changeOutputCost.output.amount().set_coin(changeOutputAmount)?
        const txOutput = buildTxOutput(
            {
                amount: changeOutputAmount.to_str(),
                address: changeAddress,
                assets: changeOutputAssets,
            },
            changeAddress,
        );

        // WARNING: It returns a change output also in a case where we don't have enough utxos to cover the output cost, but the change output is needed because it contains additional assets
        return {
            outputFee: changeOutputCost.outputFee,
            minOutputAmount: changeOutputCost.minOutputAmount,
            output: txOutput,
        };
    }

    // Change output not needed
    return null;
};

export const getTxBuilder = (a = '44'): CardanoWasm.TransactionBuilder =>
    CardanoWasm.TransactionBuilder.new(
        CardanoWasm.TransactionBuilderConfigBuilder.new()
            .fee_algo(CardanoWasm.LinearFee.new(bigNumFromStr(a), bigNumFromStr('155381')))
            .pool_deposit(bigNumFromStr('500000000'))
            .key_deposit(bigNumFromStr('2000000'))
            .coins_per_utxo_byte(bigNumFromStr(CARDANO_PARAMS.COINS_PER_UTXO_BYTE))
            .max_value_size(CARDANO_PARAMS.MAX_VALUE_SIZE)
            .max_tx_size(CARDANO_PARAMS.MAX_TX_SIZE)
            .build(),
    );

export const getUnsatisfiedAssets = (selectedUtxos: Utxo[], outputs: Output[]): string[] => {
    const assets: string[] = [];

    outputs.forEach(output => {
        const [asset] = output.assets;
        if (asset) {
            const assetAmountInUtxos = getUtxoQuantity(selectedUtxos, asset.unit);
            if (assetAmountInUtxos.compare(bigNumFromStr(asset.quantity)) < 0) {
                assets.push(asset.unit);
            }
        }
    });

    const lovelaceUtxo = getUtxoQuantity(selectedUtxos, 'lovelace');
    if (lovelaceUtxo.compare(getOutputQuantity(outputs, 'lovelace')) < 0) {
        assets.push('lovelace');
    }

    return assets;
};

export const getInitialUtxoSet = (
    utxos: Utxo[],
    maxOutput: UserOutput | undefined,
): {
    used: Utxo[];
    remaining: Utxo[];
} => {
    // Picks all utxos containing an asset on which the user requested to set maximum value
    if (!maxOutput)
        return {
            used: [],
            remaining: utxos,
        };

    const used: Utxo[] = [];
    const remaining: Utxo[] = [];

    const maxOutputAsset = maxOutput.assets[0]?.unit ?? 'lovelace';
    // either all UTXOs will be used (send max for ADA output) or initial set of used utxos will contain all utxos containing given token
    utxos.forEach(u => {
        if (u.amount.find(a => a.unit === maxOutputAsset)) {
            used.push(u);
        } else {
            remaining.push(u);
        }
    });

    return {
        used,
        remaining,
    };
};

export const setMaxOutput = (
    txBuilder: CardanoWasm.TransactionBuilder,
    maxOutput: UserOutput,
    changeOutput: OutputCost | null,
): {
    maxOutput: UserOutput;
} => {
    const [maxOutputAssetEntry] = maxOutput.assets;
    const maxOutputAsset = maxOutputAssetEntry?.unit ?? 'lovelace';
    let newMaxAmount = bigNumFromStr('0');

    const changeOutputAssets = multiAssetToArray(changeOutput?.output.amount().multiasset());

    if (maxOutputAsset === 'lovelace') {
        // set maxOutput for ADA
        if (changeOutput) {
            // Calculate the cost of previous dummy set-max output
            const previousMaxOutputCost = getOutputCost(
                txBuilder,
                maxOutput,
                maxOutput.address ?? changeOutput.output.address().to_bech32(),
            );
            newMaxAmount = changeOutput.output.amount().coin();

            if (changeOutputAssets.length === 0) {
                newMaxAmount = newMaxAmount.checked_add(previousMaxOutputCost.outputFee);
            } else {
                newMaxAmount = newMaxAmount.clamped_sub(changeOutput.minOutputAmount);

                const txOutput = CardanoWasm.TransactionOutput.new(
                    changeOutput.output.address(),
                    CardanoWasm.Value.new(newMaxAmount),
                );
                const minUtxoVal = CardanoWasm.min_ada_for_output(
                    txOutput,
                    DATA_COST_PER_UTXO_BYTE,
                );

                if (newMaxAmount.compare(minUtxoVal) < 0) {
                    // the amount would be less than min required ADA
                    throw new CoinSelectionError(ERROR.UTXO_BALANCE_INSUFFICIENT);
                }
            }
        }
        maxOutput.amount = newMaxAmount.to_str();
    } else {
        // set maxOutput for token
        // maxOutputAsset is not 'lovelace', so maxOutputAssetEntry is necessarily present.
        if (changeOutput && maxOutputAssetEntry) {
            // max amount of the asset in output is equal to its quantity in change output
            newMaxAmount = bigNumFromStr(
                changeOutputAssets.find(a => a.unit === maxOutputAsset)?.quantity ?? '0',
            );
            maxOutputAssetEntry.quantity = newMaxAmount.to_str(); // TODO: set 0 if no change?

            const txOutput = CardanoWasm.TransactionOutput.new(
                changeOutput.output.address(),
                // new_from_assets does not automatically include required ADA
                CardanoWasm.Value.new_from_assets(buildMultiAsset(maxOutput.assets)),
            );

            // adjust ADA amount to cover min ada for the asset
            maxOutput.amount = CardanoWasm.min_ada_for_output(
                txOutput,
                DATA_COST_PER_UTXO_BYTE,
            ).to_str();
        }
    }

    return { maxOutput };
};

export const getUserOutputQuantityWithDeposit = (
    outputs: UserOutput[],
    deposit: number,
    asset = 'lovelace',
): CardanoWasm.BigNum => {
    let amount = getOutputQuantity(outputs, asset);
    if (deposit > 0) {
        amount = amount.checked_add(bigNumFromStr(deposit.toString()));
    }

    return amount;
};

export const filterUtxos = (utxos: Utxo[], asset: string): Utxo[] =>
    utxos.filter(utxo => utxo.amount.find(a => a.unit === asset));

export const getRandomUtxo = (
    txBuilder: CardanoWasm.TransactionBuilder,
    utxoRemaining: Utxo[],
    utxoSelected: Utxo[],
): {
    utxo: Utxo;
    addUtxo: () => void;
} | null => {
    const index = Math.floor(Math.random() * utxoRemaining.length);
    const utxo = utxoRemaining[index];

    if (!utxo) return null;

    return {
        utxo,
        addUtxo: () => {
            utxoSelected.push(utxo);
            const { input, address, amount } = buildTxInput(utxo);
            txBuilder.add_regular_input(address, input, amount);
            utxoRemaining.splice(utxoRemaining.indexOf(utxo), 1);
        },
    };
};

export const calculateUserOutputsFee = (
    txBuilder: CardanoWasm.TransactionBuilder,
    userOutputs: UserOutput[],
    changeAddress: string,
) => {
    // Calculate fee and minUtxoValue for all external outputs
    const outputsCost = userOutputs.map(output => getOutputCost(txBuilder, output, changeAddress));

    const totalOutputsFee = outputsCost.reduce(
        (acc, output) => acc.checked_add(output.outputFee),
        bigNumFromStr('0'),
    );

    return totalOutputsFee;
};

export const orderInputs = (inputsToOrder: Utxo[], txBody: CardanoWasm.TransactionBody): Utxo[] => {
    // reorder inputs to match order within tx
    const orderedInputs: Utxo[] = [];
    for (let i = 0; i < txBody.inputs().len(); i++) {
        const txid = Buffer.from(txBody.inputs().get(i).transaction_id().to_bytes()).toString(
            'hex',
        );
        const outputIndex = txBody.inputs().get(i).index();
        const utxo = inputsToOrder.find(uu => uu.txHash === txid && uu.outputIndex === outputIndex);
        if (!utxo) {
            throw new Error(
                'Failed to order the utxos to match the order of inputs in constructed tx. THIS SHOULD NOT HAPPEN',
            );
        }
        orderedInputs.push(utxo);
    }

    return orderedInputs;
};
