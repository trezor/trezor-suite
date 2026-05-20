// origin: https://github.com/trezor/connect/blob/develop/src/js/core/methods/StellarSignTransaction.js

import stellar from '@trezor/coins-stellar/runtime';
import { StellarSignTransaction as StellarSignTransactionSchema } from '@trezor/connect-common';
import type { MethodPermission, StellarOperation } from '@trezor/connect-common';
import { ERRORS } from '@trezor/connect-common/src/constants';
import { Assert } from '@trezor/schema-utils';

import type { MethodMessage } from '../../../core/AbstractMethod';
import { AbstractMethod } from '../../../core/AbstractMethod';
import { getMiscNetwork } from '../../../data/coinInfo';
import { validatePath } from '../../../utils/pathUtils';
import {
    PAYMENT_REQUEST_AMOUNT_BYTES,
    encodePaymentRequestAmount,
} from '../../../utils/paymentRequest';
import * as helper from '../stellarSignTx';

type Params = { path: number[] } & StellarSignTransactionSchema;

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
        // validate incoming parameters
        Assert(StellarSignTransactionSchema, payload);

        const path = validatePath(payload.path, 3);
        const { payment_req } = payload;

        const params: Params = {
            ...payload,
            path,
            payment_req: payment_req
                ? encodePaymentRequestAmount(payment_req, PAYMENT_REQUEST_AMOUNT_BYTES.DEFAULT)
                : undefined,
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

    private _isFeatureSupported(feature: keyof typeof StellarSignTransactionFeatures) {
        return this.getDevice().atLeast(StellarSignTransactionFeatures[feature]);
    }

    private _ensureFirmwareSupportsOperation(
        feature: keyof typeof StellarSignTransactionFeatures,
        operations: StellarOperation[] = [],
    ) {
        if (operations.find(o => o.type === feature) && !this._isFeatureSupported(feature)) {
            throw ERRORS.TypedError(
                'Method_InvalidParameter',
                `Feature ${feature} not supported by device firmware`,
            );
        }
    }

    private async parseFromXdr(xdrBase64: string, testnet: boolean) {
        const { parseTransactionFromXDR, transformTransaction } = await stellar();

        const nativeTx = parseTransactionFromXDR(xdrBase64, testnet);

        return [transformTransaction(nativeTx), nativeTx.networkPassphrase] as const;
    }

    async run() {
        const [transaction, networkPassphrase] =
            'xdrBase64' in this.params
                ? await this.parseFromXdr(this.params.xdrBase64, this.params.testnet)
                : [this.params.transaction, this.params.networkPassphrase];

        this._ensureFirmwareSupportsOperation('manageBuyOffer', transaction.operations);
        this._ensureFirmwareSupportsOperation('pathPaymentStrictSend', transaction.operations);

        const response = await helper.stellarSignTx(
            this.getDevice().getCommands().typedCall,
            this.params.path,
            networkPassphrase,
            transaction,
            this.params.payment_req,
        );

        return {
            publicKey: response.public_key,
            signature: response.signature,
        };
    }
}
