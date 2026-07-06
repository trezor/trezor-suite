// Wire the send orchestration's injected dependencies to the real device protocols. sendMoneroTransaction
// takes a signer + key-image provider; here they are backed by the moneroSignTransaction and
// moneroKeyImageSync device exchanges (plus the ChaCha20-Poly1305 key-image decryption). These adapters
// are device-validated; the pure mappings they call (buildTransferDetails, toSignedTransactionResult)
// are unit-tested.
import type { PROTO } from '@trezor/connect-common';

import { toSignedTransactionResult } from './signedResult';
import { buildTransferDetails } from './transferDetails';
import type { DeviceCommands } from '../../../device/DeviceCommands';
import { runMoneroKeyImageSync } from '../device/keyImageSyncProtocol';
import { runMoneroSignProtocol } from '../device/signTransactionProtocol';
import type { SourceEntry, TransactionData } from '../tx/buildTransaction';
import { decryptKeyImages } from '../tx/decryptKeyImages';
import type { KeyImageProvider } from '../tx/sendMoneroTransaction';
import type { MoneroDeviceSigner } from '../tx/signTransaction';

type Commands = ReturnType<typeof DeviceCommands>;

// The compose step already produces the connect API tsx_data/source-entry shapes; this adds the
// empty-default fields the device's protobuf expects (repeated fields the device fills in itself).
const toProtoTsxData = (tsxData: TransactionData): PROTO.MoneroTransactionData => ({
    version: tsxData.version,
    unlock_time: tsxData.unlock_time,
    outputs: tsxData.outputs,
    change_dts: tsxData.change_dts,
    num_inputs: tsxData.num_inputs,
    mixin: tsxData.mixin,
    fee: tsxData.fee,
    account: tsxData.account,
    minor_indices: [],
    integrated_indices: [],
    rsig_data: {
        rsig_type: tsxData.rsig_data.rsig_type,
        bp_version: tsxData.rsig_data.bp_version,
        grouping: tsxData.rsig_data.grouping,
        rsig_parts: [],
    },
    client_version: tsxData.client_version,
    hard_fork: tsxData.hard_fork,
    ...(tsxData.payment_id ? { payment_id: tsxData.payment_id } : {}),
});

const toProtoInputs = (inputs: SourceEntry[]): PROTO.MoneroTransactionSourceEntry[] =>
    inputs.map(input => ({
        outputs: input.outputs,
        real_output: input.real_output,
        real_out_tx_key: input.real_out_tx_key,
        real_out_additional_tx_keys: input.real_out_additional_tx_keys,
        real_output_in_tx_index: input.real_output_in_tx_index,
        amount: input.amount,
        rct: input.rct,
        mask: input.mask,
        subaddr_minor: input.subaddr_minor,
    }));

export const makeDeviceSigner =
    (
        commands: Commands,
        address_n: number[],
        network_type: PROTO.MoneroNetworkType,
    ): MoneroDeviceSigner =>
    async (tsxData, inputs) => {
        const device = await runMoneroSignProtocol(commands, {
            address_n,
            network_type,
            tsx_data: toProtoTsxData(tsxData),
            inputs: toProtoInputs(inputs),
        });

        return toSignedTransactionResult(device);
    };

export const makeKeyImageProvider =
    (
        commands: Commands,
        address_n: number[],
        network_type: PROTO.MoneroNetworkType,
    ): KeyImageProvider =>
    async inputs => {
        const result = await runMoneroKeyImageSync(commands, {
            address_n,
            network_type,
            subs: [],
            tdis: buildTransferDetails(inputs),
        });

        // The device returns the key images encrypted under result.signature (enc_key); decrypt to raw.
        // Keep the per-image spend signature too: the send uses only the key image (filter + vins),
        // but it returns the full {keyImage, signature} set so the after-send import can reuse this one
        // device export instead of doing a second key-image-sync round-trip.
        return decryptKeyImages(
            result.signature,
            result.key_images.map(ki => ({ iv: ki.iv, blob: ki.key_image })),
        );
    };
