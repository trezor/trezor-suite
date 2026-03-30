// origin: https://github.com/trezor/connect/blob/develop/src/js/core/methods/StellarSignTransaction.js

import { StellarSignTransaction as StellarSignTransactionSchema } from '@trezor/connect-common';
import type { PROTO, StellarTransaction } from '@trezor/connect-common';
import { ERRORS } from '@trezor/connect-common/src/constants';
import { Assert } from '@trezor/schema-utils';

import type { MethodMessage, MethodPermission } from '../../../core/AbstractMethod';
import { AbstractMethod } from '../../../core/AbstractMethod';
import { getMiscNetwork } from '../../../data/coinInfo';
import { validatePath } from '../../../utils/pathUtils';
import { getFirmwareRange } from '../../common/paramsValidator';
import * as helper from '../stellarSignTx';

type Params = {
    path: number[];
    networkPassphrase: string;
    transaction: StellarTransaction;
    payment_req?: PROTO.PaymentRequest;
};

const StellarSignTransactionFeatures = Object.freeze({
    manageBuyOffer: ['1.10.4', '2.4.3'],
    pathPaymentStrictSend: ['1.10.4', '2.4.3'],
});

export default class StellarSignTransaction extends AbstractMethod<
    'stellarSignTransaction',
    Params
> {
    constructor(message: MethodMessage<'stellarSignTransaction'>) {
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
            payment_req: payload.payment_req,
        };
    }

    get info() {
        return 'Sign Stellar transaction';
    }

    _isFeatureSupported(feature: keyof typeof StellarSignTransactionFeatures) {
        return this.getDevice().atLeast(StellarSignTransactionFeatures[feature]);
    }

    _ensureFeatureIsSupported(feature: keyof typeof StellarSignTransactionFeatures) {
        if (!this._isFeatureSupported(feature)) {
            throw ERRORS.TypedError(
                'Method_InvalidParameter',
                `Feature ${feature} not supported by device firmware`,
            );
        }
    }

    _ensureFirmwareSupportsParams() {
        const { params } = this;
        if (
            params.transaction.operations &&
            params.transaction.operations.find(o => o.type === 'manageBuyOffer')
        ) {
            this._ensureFeatureIsSupported('manageBuyOffer');
        }

        if (
            params.transaction.operations &&
            params.transaction.operations.find(o => o.type === 'pathPaymentStrictSend')
        ) {
            this._ensureFeatureIsSupported('pathPaymentStrictSend');
        }
    }

    async run() {
        this._ensureFirmwareSupportsParams();

        const response = await helper.stellarSignTx(
            this.getDevice().getCommands().typedCall,
            this.params.path,
            this.params.networkPassphrase,
            this.params.transaction,
            this.params.payment_req,
        );

        return {
            publicKey: response.public_key,
            signature: response.signature,
        };
    }
}
