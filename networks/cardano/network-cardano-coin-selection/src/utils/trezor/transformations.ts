import * as CardanoWasm from '@emurgo/cardano-serialization-lib-nodejs';

import {
    type CardanoAddressParameters,
    type CardanoInput,
    type CardanoOutput,
} from '../../types/trezor';
import { type Asset, CardanoDRepType, type FinalOutput, type Utxo } from '../../types/types';
import { parseAsset } from '../common';

interface AssetInPolicy {
    assetNameBytes: string;
    amount: string;
}
export const transformToTokenBundle = (assets: Asset[]) => {
    // prepare token bundle used in trezor output
    if (assets.length === 0) return undefined;

    const uniquePolicies: string[] = [];
    assets.forEach(asset => {
        const { policyId } = parseAsset(asset.unit);
        if (!uniquePolicies.includes(policyId)) {
            uniquePolicies.push(policyId);
        }
    });

    const assetsByPolicy: {
        policyId: string;
        tokenAmounts: AssetInPolicy[];
    }[] = [];
    uniquePolicies.forEach(policyId => {
        const assetsInPolicy: AssetInPolicy[] = [];
        assets.forEach(asset => {
            const assetInfo = parseAsset(asset.unit);
            if (assetInfo.policyId !== policyId) return;

            assetsInPolicy.push({
                assetNameBytes: assetInfo.assetNameInHex,
                amount: asset.quantity,
            });
        });

        assetsByPolicy.push({
            policyId,
            tokenAmounts: assetsInPolicy,
        });
    });

    return assetsByPolicy;
};

export const transformToTrezorInputs = (
    utxos: Utxo[],
    trezorUtxos: { txid: string; vout: number; path: string }[],
): CardanoInput[] =>
    utxos.map(utxo => {
        const utxoWithPath = trezorUtxos.find(
            u => u.txid === utxo.txHash && u.vout === utxo.outputIndex,
        );
        // shouldn't happen since utxos should be subset of trezorUtxos (with different shape/fields)
        if (!utxoWithPath) throw Error(`Cannot transform utxo ${utxo.txHash}:${utxo.outputIndex}`);

        return {
            path: utxoWithPath.path,
            prev_hash: utxo.txHash,
            prev_index: utxo.outputIndex,
        };
    });

export const transformToTrezorOutputs = (
    outputs: FinalOutput[],
    changeAddressParameters: CardanoAddressParameters,
): CardanoOutput[] =>
    outputs.map(output => {
        let params: { address: string } | { addressParameters: CardanoAddressParameters };

        if (output.isChange) {
            params = {
                addressParameters: changeAddressParameters,
            };
        } else {
            params = {
                address: output.address,
            };
        }

        return {
            ...params,
            amount: output.amount,
            tokenBundle: transformToTokenBundle(output.assets),
        };
    });

export const drepIdToHex = (
    drepId: string,
): {
    type: CardanoDRepType.KEY_HASH | CardanoDRepType.SCRIPT_HASH;
    hex: string;
} => {
    const drep = CardanoWasm.DRep.from_bech32(drepId);
    const kind = drep.kind() as unknown as CardanoDRepType.KEY_HASH | CardanoDRepType.SCRIPT_HASH;

    let drepHex: string | undefined;
    switch (kind) {
        case CardanoDRepType.KEY_HASH:
            drepHex = drep.to_key_hash()?.to_hex();
            break;
        case CardanoDRepType.SCRIPT_HASH:
            drepHex = drep.to_script_hash()?.to_hex();
            break;
    }

    if (!drepHex) {
        throw Error('Invalid drepId');
    }

    const drepData = {
        type: kind,
        hex: drepHex,
    };
    drep.free();

    return drepData;
};
