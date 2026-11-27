import {
    type BitcoinNetworkInfo,
    type ComposeParams,
    ERRORS,
    type PermissionRequest,
    type SignedTransaction,
} from '@trezor/connect-common';
import type { ComposeOutput } from '@trezor/utxo-lib';

import type { MethodMessage } from '../core/AbstractMethod';
import { AbstractMethod } from '../core/AbstractMethod';
import { getBitcoinNetworkOrThrow } from '../data/coinInfo';
import { validateHDOutput } from './bitcoin/outputs';
import { validateParams } from './common/paramsValidator';

type Params = Omit<ComposeParams, 'outputs'> & {
    outputs: ComposeOutput[];
    coinInfo: BitcoinNetworkInfo;
    push: boolean;
    identity?: string;
};

export default class SendTransaction extends AbstractMethod<'sendTransaction', Params> {
    constructor(message: MethodMessage<'sendTransaction'>) {
        const { payload } = message;
        // validate incoming parameters
        validateParams(payload, [
            { name: 'outputs', type: 'array', required: true },
            { name: 'coin', type: 'string', required: true },
            { name: 'identity', type: 'string' },
            { name: 'push', type: 'boolean' },
            { name: 'baseFee', type: 'number' },
            { name: 'sequence', type: 'number' },
            { name: 'sortingStrategy', type: 'string' },
        ]);

        const coinInfo = getBitcoinNetworkOrThrow(payload.coin);

        // validate each output and transform into @trezor/utxo-lib/compose format
        const outputs = payload.outputs.map(out => validateHDOutput(out, coinInfo));

        const params = {
            outputs,
            coinInfo,
            coin: payload.coin,
            identity: payload.identity,
            baseFee: payload.baseFee,
            sequence: payload.sequence,
            sortingStrategy: payload.sortingStrategy,
            push: typeof payload.push === 'boolean' ? payload.push : false,
        };

        super(message, params);

        this.useDevice = false;
        this.useDeviceState = false;
        this.requiredFirmwareCoins = [coinInfo];
    }

    get requiredPermissions(): PermissionRequest[] {
        const permissions: PermissionRequest[] = [this.coinPerm('sign', this.params.coinInfo)];
        if (this.params.push) {
            permissions.push(this.coinPerm('push_tx', this.params.coinInfo));
        }

        return permissions;
    }

    // Composed, selected and signed by Trezor Suite instead, see its sendTransaction popup flow.
    run(): Promise<SignedTransaction> {
        return Promise.reject(
            ERRORS.TypedError(
                'Method_NotAllowed',
                'sendTransaction is available only through Trezor Suite',
            ),
        );
    }
}
