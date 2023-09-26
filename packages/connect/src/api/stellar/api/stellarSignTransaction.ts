// origin: https://github.com/trezor/connect/blob/develop/src/js/core/methods/StellarSignTransaction.js

import { AbstractMethod } from '../../../core/AbstractMethod';
import { validateParams, getFirmwareRange } from '../../common/paramsValidator';
import { getMiscNetwork } from '../../../data/coinInfo';
import { validatePath } from '../../../utils/pathUtils';
import * as helper from '../stellarSignTx';
import { ERRORS } from '../../../constants';
import { StellarTransaction } from '../../../types/api/stellar';

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
    init() {
        this.requiredPermissions = ['read', 'write'];
        this.firmwareRange = getFirmwareRange(
            this.name,
            getMiscNetwork('Stellar'),
            this.firmwareRange,
        );

        const { payload } = this;
        // validate incoming parameters
        validateParams(payload, [
            { name: 'path', required: true },
            { name: 'networkPassphrase', type: 'string', required: true },
            { name: 'transaction', required: true },
        ]);

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

    _isFeatureSupported(feature: keyof typeof StellarSignTransactionFeatures) {
        return this.device.atLeast(StellarSignTransactionFeatures[feature]);
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
            this.device.getCommands().typedCall.bind(this.device.getCommands()),
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
