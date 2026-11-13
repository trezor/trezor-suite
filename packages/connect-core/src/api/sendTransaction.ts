import {
    type BitcoinNetworkInfo,
    type ComposeParams,
    ERRORS,
    type PermissionRequest,
    type SignedTransaction,
} from '@trezor/connect-common';
import { BigNumber } from '@trezor/utils/src/bigNumber';
import type { ComposeOutput } from '@trezor/utxo-lib';

import type { MethodMessage } from '../core/AbstractMethod';
import { AbstractMethod } from '../core/AbstractMethod';
import { getBitcoinNetworkOrThrow } from '../data/coinInfo';
import { formatAmount } from '../utils/formatUtils';
import { validateHDOutput } from './bitcoin/outputs';
import { validateParams } from './common/paramsValidator';

type Params = Omit<ComposeParams, 'outputs'> & {
    outputs: ComposeOutput[];
    coinInfo: BitcoinNetworkInfo;
    push: boolean;
    identity?: string;
    total: BigNumber;
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
        const outputs: ComposeOutput[] = [];
        let total = new BigNumber(0);
        payload.outputs.forEach(out => {
            const output = validateHDOutput(out, coinInfo);
            if ('amount' in output && typeof output.amount === 'string') {
                total = total.plus(output.amount);
            }
            outputs.push(output);
        });

        const params = {
            outputs,
            coinInfo,
            coin: payload.coin,
            identity: payload.identity,
            baseFee: payload.baseFee,
            sequence: payload.sequence,
            sortingStrategy: payload.sortingStrategy,
            push: typeof payload.push === 'boolean' ? payload.push : false,
            total,
        };

        super(message, params);

        this.useDevice = false;
        this.useDeviceState = false;
        this.requiredFirmwareCoins = [coinInfo];
    }

    // Trezor Suite's popup flow uses the device.
    get useUi() {
        return true;
    }

    get requiredPermissions(): PermissionRequest[] {
        const permissions: PermissionRequest[] = [this.coinPerm('sign', this.params.coinInfo)];
        if (this.params.push) {
            permissions.push(this.coinPerm('push_tx', this.params.coinInfo));
        }

        return permissions;
    }

    get info() {
        const sendMax = this.params.outputs.some(o => o.type === 'send-max');

        if (sendMax) {
            return 'Send maximum amount';
        }

        return `Send ${formatAmount(this.params.total.toString(), this.params.coinInfo)}`;
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
