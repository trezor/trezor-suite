import type { PROTO } from '@trezor/connect-common';
import { ERRORS } from '@trezor/connect-common/src/constants';

import type {
    MethodMessage,
    MethodPermission,
    MethodReturnType,
} from '../../../core/AbstractMethod';
import { AbstractMethod } from '../../../core/AbstractMethod';
import { getMiscNetwork } from '../../../data/coinInfo';
import { HD_HARDENED, validatePath } from '../../../utils/pathUtils';
import { getFirmwareRange } from '../../common/paramsValidator';

type Params = {
    address_n: number[];
    network_type: PROTO.MoneroNetworkType;
    tsx_data: PROTO.MoneroTransactionData;
    inputs: PROTO.MoneroTransactionSourceEntry[];
};

// Temporary storage for multi-step protocol
type ProtocolState = {
    hmacs: string[];
    vinis: {
        vini: string;
        vini_hmac: string;
        pseudo_out: string;
        pseudo_out_hmac: string;
        pseudo_out_alpha: string;
        spend_key: string;
        src_entr: PROTO.MoneroTransactionSourceEntry;
        orig_idx: number;
    }[];
    tx_prefix_hash?: string;
    rv?: PROTO.MoneroRingCtSig;
    signatures: string[];
    pseudo_outs: string[];
    out_pks: string[];
    ecdh_infos: string[];
    tx_outs: string[];
    rsig_parts: string[];
    extra?: string;
};

export default class MoneroSignTransactionMethod extends AbstractMethod<
    'moneroSignTransaction',
    Params
> {
    get requiredPermissions(): MethodPermission[] {
        return ['read', 'write'];
    }

    private state: ProtocolState = {
        hmacs: [],
        vinis: [],
        signatures: [],
        pseudo_outs: [],
        out_pks: [],
        ecdh_infos: [],
        tx_outs: [],
        rsig_parts: [],
    };

    constructor(message: MethodMessage<'moneroSignTransaction'>) {
        const { payload } = message;

        // Validate path - must be minimum 3 hardened components
        const path = validatePath(payload.path, 3);
        const allHardened = path.every(component => (component & HD_HARDENED) !== 0);
        if (!allHardened) {
            throw ERRORS.TypedError(
                'Method_InvalidParameter',
                `Monero requires all path components to be hardened. Use m/44'/128'/0' format.`,
            );
        }

        // Validate inputs
        if (payload.inputs.length < 1) {
            throw ERRORS.TypedError('Method_InvalidParameter', 'At least one input is required');
        }

        // Validate tsx_data required fields
        if (payload.tsx_data.outputs.length < 2) {
            throw ERRORS.TypedError('Method_InvalidParameter', 'At least 2 outputs are required');
        }

        // Validate rsig_data (required fields)
        const rsigData = payload.tsx_data.rsig_data;
        if (rsigData.grouping.length < 1) {
            throw ERRORS.TypedError(
                'Method_InvalidParameter',
                'Missing required fields in rsig_data',
            );
        }

        // Validate number of inputs matches tsx_data.num_inputs
        if (payload.inputs.length !== payload.tsx_data.num_inputs) {
            throw ERRORS.TypedError(
                'Method_InvalidParameter',
                'Number of inputs does not match tsx_data.num_inputs',
            );
        }

        // Transform tsx_data from API format to protobuf format
        const transformedTsxData: any = {};

        // Add required fields (already validated above)
        transformedTsxData.num_inputs = payload.tsx_data.num_inputs;
        transformedTsxData.mixin = payload.tsx_data.mixin;
        transformedTsxData.fee = payload.tsx_data.fee;
        transformedTsxData.account = payload.tsx_data.account;
        transformedTsxData.hard_fork = payload.tsx_data.hard_fork;
        transformedTsxData.unlock_time = payload.tsx_data.unlock_time;
        transformedTsxData.minor_indices = payload.tsx_data.minor_indices || [];
        transformedTsxData.integrated_indices = payload.tsx_data.integrated_indices || [];
        transformedTsxData.outputs = payload.tsx_data.outputs;
        transformedTsxData.client_version = 3;
        transformedTsxData.version = 1;

        // Add optional fields only if defined
        if (payload.tsx_data.payment_id !== undefined && payload.tsx_data.payment_id !== '') {
            transformedTsxData.payment_id = payload.tsx_data.payment_id;
        }
        if (
            payload.tsx_data.monero_version !== undefined &&
            payload.tsx_data.monero_version !== ''
        ) {
            transformedTsxData.monero_version = payload.tsx_data.monero_version;
        }
        if (payload.tsx_data.chunkify !== undefined) {
            transformedTsxData.chunkify = payload.tsx_data.chunkify;
        }
        if (payload.tsx_data.change_dts) {
            transformedTsxData.change_dts = payload.tsx_data.change_dts;
        }

        // Transform rsig_data
        transformedTsxData.rsig_data = {
            rsig_type: rsigData.rsig_type,
            bp_version: rsigData.bp_version,
            grouping: rsigData.grouping,
            rsig_parts: rsigData.rsig_parts || [],
        };

        // Add optional rsig_data fields only if defined and non-empty
        if (rsigData.offload_type !== undefined) {
            transformedTsxData.rsig_data.offload_type = rsigData.offload_type;
        }
        if (rsigData.mask !== undefined && rsigData.mask !== '') {
            transformedTsxData.rsig_data.mask = rsigData.mask;
        }
        if (rsigData.rsig !== undefined && rsigData.rsig !== '') {
            transformedTsxData.rsig_data.rsig = rsigData.rsig;
        }

        // Transform inputs array (keep hex strings, protobuf handles conversion)
        const transformedInputs = payload.inputs.map(input => {
            const transformedInput: any = {};
            transformedInput.amount = input.amount;
            transformedInput.real_output = input.real_output;
            transformedInput.real_output_in_tx_index = input.real_output_in_tx_index;
            transformedInput.rct = input.rct;
            transformedInput.subaddr_minor = input.subaddr_minor;
            transformedInput.real_out_tx_key = input.real_out_tx_key;
            transformedInput.real_out_additional_tx_keys = input.real_out_additional_tx_keys || [];
            transformedInput.outputs = input.outputs;
            transformedInput.mask = input.mask;

            if (input.multisig_kLRki) {
                transformedInput.multisig_kLRki = input.multisig_kLRki;
            }

            return transformedInput;
        });

        const params = {
            address_n: path,
            network_type: payload.networkType,
            tsx_data: transformedTsxData,
            inputs: transformedInputs,
        };

        super(message, params);

        this.requiredDeviceCapabilities = ['Capability_Monero'];
        this.firmwareRange = getFirmwareRange(
            this.name,
            getMiscNetwork('Monero'),
            this.firmwareRange,
        );
    }

    get info() {
        return 'Sign Monero transaction';
    }

    async run(): Promise<MethodReturnType<typeof this.name>> {
        // Step 1: Init - Send transaction data
        const initResponse = await this.getDevice()
            .getCommands()
            .typedCall('MoneroTransactionInitRequest', 'MoneroTransactionInitAck', {
                version: 0,
                address_n: this.params.address_n,
                network_type: this.params.network_type,
                tsx_data: this.params.tsx_data,
            });

        this.state.hmacs = initResponse.message.hmacs;

        // Step 2: SetInput - Process each UTXO
        for (let i = 0; i < this.params.inputs.length; i++) {
            const setInputResponse = await this.getDevice()
                .getCommands()
                .typedCall('MoneroTransactionSetInputRequest', 'MoneroTransactionSetInputAck', {
                    src_entr: this.params.inputs[i],
                });

            // Store for later steps
            this.state.vinis.push({
                vini: setInputResponse.message.vini,
                vini_hmac: setInputResponse.message.vini_hmac,
                pseudo_out: setInputResponse.message.pseudo_out,
                pseudo_out_hmac: setInputResponse.message.pseudo_out_hmac,
                pseudo_out_alpha: setInputResponse.message.pseudo_out_alpha,
                spend_key: setInputResponse.message.spend_key,
                src_entr: this.params.inputs[i],
                orig_idx: i,
            });
        }

        // Step 3: InputVini - Submit all inputs in order
        for (let i = 0; i < this.state.vinis.length; i++) {
            const viniData = this.state.vinis[i];
            await this.getDevice()
                .getCommands()
                .typedCall('MoneroTransactionInputViniRequest', 'MoneroTransactionInputViniAck', {
                    src_entr: viniData.src_entr,
                    vini: viniData.vini,
                    vini_hmac: viniData.vini_hmac,
                    pseudo_out: viniData.pseudo_out,
                    pseudo_out_hmac: viniData.pseudo_out_hmac,
                    orig_idx: viniData.orig_idx,
                });
        }

        // Step 4: AllInputsSet
        await this.getDevice()
            .getCommands()
            .typedCall(
                'MoneroTransactionAllInputsSetRequest',
                'MoneroTransactionAllInputsSetAck',
                {},
            );

        // Step 5: SetOutput - Process each output and capture response data
        const outputs = this.params.tsx_data.outputs || [];
        for (let i = 0; i < outputs.length; i++) {
            const setOutputResponse = await this.getDevice()
                .getCommands()
                .typedCall('MoneroTransactionSetOutputRequest', 'MoneroTransactionSetOutputAck', {
                    dst_entr: outputs[i],
                    dst_entr_hmac: this.state.hmacs[i],
                });

            if (setOutputResponse.message.out_pk) {
                this.state.out_pks.push(setOutputResponse.message.out_pk);
            }
            if (setOutputResponse.message.ecdh_info) {
                this.state.ecdh_infos.push(setOutputResponse.message.ecdh_info);
            }
            if (setOutputResponse.message.tx_out) {
                this.state.tx_outs.push(setOutputResponse.message.tx_out);
            }
            if (setOutputResponse.message.rsig_data?.rsig) {
                this.state.rsig_parts.push(setOutputResponse.message.rsig_data.rsig);
            }
        }

        // Step 6: AllOutSet - Get RCT signature fields and extra
        const allOutSetResponse = await this.getDevice()
            .getCommands()
            .typedCall('MoneroTransactionAllOutSetRequest', 'MoneroTransactionAllOutSetAck', {});

        this.state.tx_prefix_hash = allOutSetResponse.message.tx_prefix_hash;
        this.state.rv = allOutSetResponse.message.rv;
        this.state.extra = allOutSetResponse.message.extra;

        // Step 7: SignInput - Generate CLSAG signatures for each input
        for (let i = 0; i < this.state.vinis.length; i++) {
            const viniData = this.state.vinis[i];
            const signResponse = await this.getDevice()
                .getCommands()
                .typedCall('MoneroTransactionSignInputRequest', 'MoneroTransactionSignInputAck', {
                    src_entr: viniData.src_entr,
                    vini: viniData.vini,
                    vini_hmac: viniData.vini_hmac,
                    pseudo_out: viniData.pseudo_out,
                    pseudo_out_hmac: viniData.pseudo_out_hmac,
                    pseudo_out_alpha: viniData.pseudo_out_alpha,
                    spend_key: viniData.spend_key,
                    orig_idx: viniData.orig_idx,
                });

            this.state.signatures.push(signResponse.message.signature!);
            // pseudo_out may be updated after mask correction
            if (signResponse.message.pseudo_out) {
                this.state.pseudo_outs.push(signResponse.message.pseudo_out);
            }
        }

        // Step 8: Final - Get encryption keys
        const finalResponse = await this.getDevice()
            .getCommands()
            .typedCall('MoneroTransactionFinalRequest', 'MoneroTransactionFinalAck', {});

        return {
            signatures: this.state.signatures,
            tx_prefix_hash: this.state.tx_prefix_hash,
            rv: this.state.rv,
            cout_key: finalResponse.message.cout_key,
            salt: finalResponse.message.salt,
            rand_mult: finalResponse.message.rand_mult,
            tx_enc_keys: finalResponse.message.tx_enc_keys,
            opening_key: finalResponse.message.opening_key,
            pseudo_outs: this.state.pseudo_outs,
            out_pks: this.state.out_pks,
            ecdh_infos: this.state.ecdh_infos,
            tx_outs: this.state.tx_outs,
            rsig_parts: this.state.rsig_parts,
            extra: this.state.extra,
        };
    }
}
