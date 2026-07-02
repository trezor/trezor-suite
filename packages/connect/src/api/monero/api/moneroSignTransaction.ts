import type { PROTO, PermissionRequest } from '@trezor/connect-common';
import { ERRORS } from '@trezor/connect-common/src/constants';
import { HD_HARDENED_PATH_PART } from '@trezor/crypto-utils';

import type { MethodMessage, MethodReturnType } from '../../../core/AbstractMethod';
import { AbstractMethod } from '../../../core/AbstractMethod';
import { getMiscNetwork } from '../../../data/coinInfo';
import { validatePath } from '../../../utils/pathUtils';
import { runMoneroSignProtocol } from '../device/signTransactionProtocol';

type Params = {
    address_n: number[];
    network_type: PROTO.MoneroNetworkType;
    tsx_data: PROTO.MoneroTransactionData;
    inputs: PROTO.MoneroTransactionSourceEntry[];
};

export default class MoneroSignTransactionMethod extends AbstractMethod<
    'moneroSignTransaction',
    Params
> {
    get requiredPermissions(): PermissionRequest[] {
        return this.coinPerms('sign', this.requiredFirmwareCoins);
    }

    constructor(message: MethodMessage<'moneroSignTransaction'>) {
        const { payload } = message;

        // Validate path - must be minimum 3 hardened components
        const path = validatePath(payload.path, 3);
        const allHardened = path.every(component => (component & HD_HARDENED_PATH_PART) !== 0);
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
        this.requiredFirmwareCoins = [getMiscNetwork('xmr')];
    }

    get info() {
        return 'Sign Monero transaction';
    }

    run(): Promise<MethodReturnType<typeof this.name>> {
        return runMoneroSignProtocol(this.getDevice().getCommands(), this.params);
    }
}
