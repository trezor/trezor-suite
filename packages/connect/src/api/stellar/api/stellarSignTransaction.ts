// origin: https://github.com/trezor/connect/blob/develop/src/js/core/methods/StellarSignTransaction.js

import { ERRORS } from '@trezor/connect-common/src/constants';
import { Assert } from '@trezor/schema-utils';

import { AbstractMethod, MethodPermission, Payload } from '../../../core/AbstractMethod';
import { getMiscNetwork } from '../../../data/coinInfo';
import type { Device } from '../../../device/Device';
import {
    StellarSignTransaction as StellarSignTransactionSchema,
    StellarTransaction,
} from '../../../types/api/stellar';
import { validatePath } from '../../../utils/pathUtils';
import { getFirmwareRange } from '../../common/paramsValidator';
import * as helper from '../stellarSignTx';

type Params = {
    path: number[];
    networkPassphrase: string;
    transaction: StellarTransaction;
};

const StellarSignTransactionFeatures = Object.freeze({
    manageBuyOffer: ['1.10.4', '2.4.3'],
    pathPaymentStrictSend: ['1.10.4', '2.4.3'],
});

export default class StellarSignTransaction extends AbstractMethod<
    'stellarSignTransaction',
    Params
> {
    constructor(message: { id?: number; payload: Payload<'stellarSignTransaction'> }) {
        super(message);
        this.requiredDeviceCapabilities = ['Capability_Stellar'];
        this.firmwareRange = getFirmwareRange(
            this.name,
            getMiscNetwork('Stellar'),
            this.firmwareRange,
        );
    }

    get requiredPermissions(): MethodPermission[] {
        return ['read', 'write'];
    }

    init() {
        const { payload } = this;
        // validate incoming parameters
        Assert(StellarSignTransactionSchema, payload);

        const path = validatePath(payload.path, 3);
        // incoming data should be in stellar-sdk format
        const { transaction } = payload;
        this.params = {
            path,
            networkPassphrase: payload.networkPassphrase,
            transaction,
        };
    }

    get info() {
        return 'Sign Stellar transaction';
    }

    _isFeatureSupported(device: Device, feature: keyof typeof StellarSignTransactionFeatures) {
        return device.atLeast(StellarSignTransactionFeatures[feature]);
    }

    _ensureFeatureIsSupported(
        device: Device,
        feature: keyof typeof StellarSignTransactionFeatures,
    ) {
        if (!this._isFeatureSupported(device, feature)) {
            throw ERRORS.TypedError(
                'Method_InvalidParameter',
                `Feature ${feature} not supported by device firmware`,
            );
        }
    }

    _ensureFirmwareSupportsParams(device: Device) {
        const { params } = this;
        if (
            params.transaction.operations &&
            params.transaction.operations.find(o => o.type === 'manageBuyOffer')
        ) {
            this._ensureFeatureIsSupported(device, 'manageBuyOffer');
        }

        if (
            params.transaction.operations &&
            params.transaction.operations.find(o => o.type === 'pathPaymentStrictSend')
        ) {
            this._ensureFeatureIsSupported(device, 'pathPaymentStrictSend');
        }
    }

    async run(device: Device) {
        this._ensureFirmwareSupportsParams(device);

        const response = await helper.stellarSignTx(
            device.getCommands().typedCall,
            this.params.path,
            this.params.networkPassphrase,
            this.params.transaction,
        );

        return {
            publicKey: response.public_key,
            signature: response.signature,
        };
    }
}
