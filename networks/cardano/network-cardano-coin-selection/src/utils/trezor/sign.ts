import * as CardanoWasm from '@emurgo/cardano-serialization-lib-nodejs';

import { type CardanoSignedTxWitness, CardanoTxWitnessType } from '../../types/trezor';
import { getProtocolMagic } from '../common';

export const signTransaction = (
    txBodyHex: string,
    // txMetadata: CardanoWasm.AuxiliaryData,
    signedWitnesses: CardanoSignedTxWitness[],
    options?: { testnet?: boolean },
): string => {
    const txBody = CardanoWasm.TransactionBody.from_bytes(
        Uint8Array.from(Buffer.from(txBodyHex, 'hex')),
    );
    const witnesses = CardanoWasm.TransactionWitnessSet.new();
    const vkeyWitnesses = CardanoWasm.Vkeywitnesses.new();
    const bootstrapWitnesses = CardanoWasm.BootstrapWitnesses.new();

    signedWitnesses.forEach(w => {
        const vKey = CardanoWasm.Vkey.new(
            CardanoWasm.PublicKey.from_bytes(Buffer.from(w.pubKey, 'hex')),
        );
        const signature = CardanoWasm.Ed25519Signature.from_bytes(Buffer.from(w.signature, 'hex'));

        if (w.type === CardanoTxWitnessType.SHELLEY_WITNESS) {
            // Shelley witness
            const vKeyWitness = CardanoWasm.Vkeywitness.new(vKey, signature);
            vkeyWitnesses.add(vKeyWitness);
        } else if (w.type === CardanoTxWitnessType.BYRON_WITNESS) {
            // Byron witness (TODO: not used, needs testing)
            if (w.chainCode) {
                const xpubHex = `${w.pubKey}${w.chainCode}`;
                const bip32Key = CardanoWasm.Bip32PublicKey.from_bytes(Buffer.from(xpubHex, 'hex'));
                const byronAddress = CardanoWasm.ByronAddress.icarus_from_key(
                    bip32Key,
                    getProtocolMagic(!!options?.testnet),
                );
                const bootstrapWitness = CardanoWasm.BootstrapWitness.new(
                    vKey,
                    signature,
                    Buffer.from(w.chainCode, 'hex'),
                    byronAddress.attributes(),
                );
                bootstrapWitnesses.add(bootstrapWitness);
            }
        }
    });

    if (bootstrapWitnesses.len() > 0) {
        witnesses.set_bootstraps(bootstrapWitnesses);
    }
    if (vkeyWitnesses.len() > 0) {
        witnesses.set_vkeys(vkeyWitnesses);
    }

    const transaction = CardanoWasm.Transaction.new(txBody, witnesses);
    const serializedTx = Buffer.from(transaction.to_bytes()).toString('hex');

    return serializedTx;
};
