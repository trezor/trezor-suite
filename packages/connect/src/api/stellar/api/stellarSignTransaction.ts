// origin: https://github.com/trezor/connect/blob/develop/src/js/core/methods/StellarSignTransaction.js

import { StellarSignTransaction as StellarSignTransactionSchema } from '@trezor/connect-common';
import type { PROTO, StellarTransaction } from '@trezor/connect-common';
import { ERRORS } from '@trezor/connect-common/src/constants';
import { Assert } from '@trezor/schema-utils';

import type { MethodMessage, MethodPermission } from '../../../core/AbstractMethod';
import { AbstractMethod } from '../../../core/AbstractMethod';
import { getMiscNetwork } from '../../../data/coinInfo';
import { validatePath } from '../../../utils/pathUtils';
import * as helper from '../stellarSignTx';
import { isRawStellarTransaction, transformTransaction } from '../stellarSignTx';

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
        const { payload } = message;

        // Callers may pass a raw `@stellar/stellar-sdk` Transaction directly
        // (Connect 10 inlines what was previously @trezor/connect-plugin-stellar's
        // transformTransaction). We normalize before schema validation so the
        // schema can stay strict on the protobuf-aligned StellarTransaction shape.
        const normalizedPayload = isRawStellarTransaction(payload.transaction)
            ? {
                  ...payload,
                  ...transformTransaction(payload.path, payload.transaction),
              }
            : payload;

        // validate incoming parameters
        Assert(StellarSignTransactionSchema, normalizedPayload);

        const path = validatePath(normalizedPayload.path, 3);
        // After normalization, `transaction` is always the strict StellarTransaction
        // shape — the pre-transform branch produced one and the strict-input branch
        // already had one. The schema's union is for the public API surface only.
        const transaction = normalizedPayload.transaction as StellarTransaction;
        const params = {
            path,
            networkPassphrase: normalizedPayload.networkPassphrase,
            transaction,
            payment_req: normalizedPayload.payment_req,
        };

        super(message, params);

        this.requiredDeviceCapabilities = ['Capability_Stellar'];
        this.requiredFirmwareCoins = [getMiscNetwork('Stellar')];
    }

    get requiredPermissions(): MethodPermission[] {
        return ['read', 'write'];
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
