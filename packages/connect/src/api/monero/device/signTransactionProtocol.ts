// The moneroSignTransaction device protocol (the 8-step InitRequest → … → FinalRequest exchange),
// extracted so both the moneroSignTransaction method and the send orchestration drive the device the
// same way. It is a faithful relocation of the original method body; behaviour is validated by the
// connect emulator e2e fixtures. It cannot be unit-tested headlessly (needs a device).
import type { MoneroSignedTransaction, PROTO } from '@trezor/connect-common';
import { ERRORS } from '@trezor/connect-common/src/constants';

import type { DeviceCommands } from '../../../device/DeviceCommands';
import { decryptSignatures } from '../tx/decryptSignatures';

type Commands = ReturnType<typeof DeviceCommands>;

export interface SignTransactionParams {
    address_n: number[];
    network_type: PROTO.MoneroNetworkType;
    tsx_data: PROTO.MoneroTransactionData;
    inputs: PROTO.MoneroTransactionSourceEntry[];
}

type Vini = {
    vini: string;
    vini_hmac: string;
    pseudo_out: string;
    pseudo_out_hmac: string;
    pseudo_out_alpha: string;
    spend_key: string;
    src_entr: PROTO.MoneroTransactionSourceEntry;
    orig_idx: number;
};

export const runMoneroSignProtocol = async (
    commands: Commands,
    params: SignTransactionParams,
): Promise<MoneroSignedTransaction> => {
    // Step 1: Init — send transaction data, receive the per-output hmacs.
    const initResponse = await commands.typedCall(
        'MoneroTransactionInitRequest',
        'MoneroTransactionInitAck',
        {
            version: 0,
            address_n: params.address_n,
            network_type: params.network_type,
            tsx_data: params.tsx_data,
        },
    );
    const { hmacs } = initResponse.message;

    // Step 2: SetInput — process each input, storing the device's vini pieces for later steps.
    const vinis: Vini[] = [];
    for (let i = 0; i < params.inputs.length; i++) {
        // @ts-expect-error: indexing with noUncheckedIndexedAccess
        const src_entr: PROTO.MoneroTransactionSourceEntry = params.inputs[i];
        const setInputResponse = await commands.typedCall(
            'MoneroTransactionSetInputRequest',
            'MoneroTransactionSetInputAck',
            { src_entr },
        );

        vinis.push({
            vini: setInputResponse.message.vini,
            vini_hmac: setInputResponse.message.vini_hmac,
            pseudo_out: setInputResponse.message.pseudo_out,
            pseudo_out_hmac: setInputResponse.message.pseudo_out_hmac,
            pseudo_out_alpha: setInputResponse.message.pseudo_out_alpha,
            spend_key: setInputResponse.message.spend_key,
            src_entr,
            orig_idx: i,
        });
    }

    // Step 3: InputVini — submit all inputs in order.
    for (const viniData of vinis) {
        await commands.typedCall(
            'MoneroTransactionInputViniRequest',
            'MoneroTransactionInputViniAck',
            {
                src_entr: viniData.src_entr,
                vini: viniData.vini,
                vini_hmac: viniData.vini_hmac,
                pseudo_out: viniData.pseudo_out,
                pseudo_out_hmac: viniData.pseudo_out_hmac,
                orig_idx: viniData.orig_idx,
            },
        );
    }

    // Step 4: AllInputsSet.
    await commands.typedCall(
        'MoneroTransactionAllInputsSetRequest',
        'MoneroTransactionAllInputsSetAck',
        {},
    );

    // Step 5: SetOutput — process each output, collecting the signed pieces.
    const outPks: string[] = [];
    const ecdhInfos: string[] = [];
    const txOuts: string[] = [];
    const rsigParts: string[] = [];
    const outputs = params.tsx_data.outputs || [];
    for (let i = 0; i < outputs.length; i++) {
        // @ts-expect-error: indexing with noUncheckedIndexedAccess
        const dst_entr: PROTO.MoneroTransactionDestinationEntry = outputs[i];
        // @ts-expect-error: indexing with noUncheckedIndexedAccess
        const dst_entr_hmac: string = hmacs[i];
        const setOutputResponse = await commands.typedCall(
            'MoneroTransactionSetOutputRequest',
            'MoneroTransactionSetOutputAck',
            { dst_entr, dst_entr_hmac },
        );

        if (setOutputResponse.message.out_pk) {
            outPks.push(setOutputResponse.message.out_pk);
        }
        if (setOutputResponse.message.ecdh_info) {
            ecdhInfos.push(setOutputResponse.message.ecdh_info);
        }
        if (setOutputResponse.message.tx_out) {
            txOuts.push(setOutputResponse.message.tx_out);
        }
        if (setOutputResponse.message.rsig_data?.rsig) {
            rsigParts.push(setOutputResponse.message.rsig_data.rsig);
        }
    }

    // Fail fast on a buggy/compromised device response that would misalign the parallel output-side
    // arrays — each output must yield exactly one out_pk / ecdh_info / tx_out. rsigParts is NOT checked
    // (BulletproofPlus is batched via the grouping array, so it is legitimately shorter).
    if (
        outPks.length !== outputs.length ||
        ecdhInfos.length !== outputs.length ||
        txOuts.length !== outputs.length
    ) {
        throw ERRORS.TypedError('Runtime', 'Monero sign: output-side array count mismatch');
    }

    // Step 6: AllOutSet — get the RingCT base + extra.
    const allOutSetResponse = await commands.typedCall(
        'MoneroTransactionAllOutSetRequest',
        'MoneroTransactionAllOutSetAck',
        {},
    );
    const { tx_prefix_hash } = allOutSetResponse.message;
    const { rv } = allOutSetResponse.message;
    const { extra } = allOutSetResponse.message;

    // Step 7: SignInput — generate a CLSAG per input.
    const signatures: string[] = [];
    const pseudoOuts: string[] = [];
    for (const viniData of vinis) {
        const signResponse = await commands.typedCall(
            'MoneroTransactionSignInputRequest',
            'MoneroTransactionSignInputAck',
            {
                src_entr: viniData.src_entr,
                vini: viniData.vini,
                vini_hmac: viniData.vini_hmac,
                pseudo_out: viniData.pseudo_out,
                pseudo_out_hmac: viniData.pseudo_out_hmac,
                pseudo_out_alpha: viniData.pseudo_out_alpha,
                spend_key: viniData.spend_key,
                orig_idx: viniData.orig_idx,
            },
        );

        signatures.push(signResponse.message.signature!);
        // pseudo_out may be updated after mask correction.
        if (signResponse.message.pseudo_out) {
            pseudoOuts.push(signResponse.message.pseudo_out);
        }
    }

    // Exactly one CLSAG signature per input. pseudoOuts is NOT checked (the device only returns a
    // pseudo_out when it corrects the mask, so it is legitimately shorter).
    if (signatures.length !== vinis.length) {
        throw ERRORS.TypedError('Runtime', 'Monero sign: signature count mismatch');
    }

    // Step 8: Final — get the encryption keys, including the opening_key that unlocks the signatures.
    const finalResponse = await commands.typedCall(
        'MoneroTransactionFinalRequest',
        'MoneroTransactionFinalAck',
        {},
    );

    // Each SignInput returned its CLSAG signature ENCRYPTED under a key derived from the device's
    // per-tx opening_key (only revealed now). Decrypt them in signing order before assembly — an
    // encrypted signature serializes to an off-curve D and monerod rejects the tx as invalid_input.
    const openingKey = finalResponse.message.opening_key;
    if (!openingKey) {
        throw ERRORS.TypedError('Runtime', 'Device did not return the signature opening key');
    }
    const decryptedSignatures = decryptSignatures(openingKey, signatures);

    return {
        signatures: decryptedSignatures,
        tx_prefix_hash,
        rv,
        cout_key: finalResponse.message.cout_key,
        salt: finalResponse.message.salt,
        rand_mult: finalResponse.message.rand_mult,
        tx_enc_keys: finalResponse.message.tx_enc_keys,
        opening_key: finalResponse.message.opening_key,
        pseudo_outs: pseudoOuts,
        out_pks: outPks,
        ecdh_infos: ecdhInfos,
        tx_outs: txOuts,
        rsig_parts: rsigParts,
        extra,
    };
};
