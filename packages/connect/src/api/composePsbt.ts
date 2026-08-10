import {
    type BitcoinNetworkInfo,
    type ComposePsbtParams,
    ERRORS,
    type PermissionRequest,
} from '@trezor/connect-common';

import type { MethodMessage } from '../core/AbstractMethod';
import { AbstractMethod } from '../core/AbstractMethod';
import { getBitcoinNetwork } from '../data/coinInfo';
import { parsePsbt } from './bitcoin/parsePsbt';
import { validateParams } from './common/paramsValidator';

type Params = Omit<ComposePsbtParams, 'coin'> & {
    coinInfo: BitcoinNetworkInfo;
};

export default class ComposePsbt extends AbstractMethod<'composePsbt', Params> {
    constructor(message: MethodMessage<'composePsbt'>) {
        const { payload } = message;
        // validate incoming parameters
        validateParams(payload, [
            { name: 'account', type: 'object', required: true },
            { name: 'psbtData', type: 'string', required: true },
            { name: 'coin', type: 'string', required: true },
        ]);

        const coinInfo = getBitcoinNetwork(payload.coin);
        if (!coinInfo) {
            throw ERRORS.TypedError('Method_UnknownCoin');
        }

        const params = {
            account: payload.account,
            psbtData: payload.psbtData,
            coinInfo,
        };

        super(message, params);

        this.useDevice = false;
        this.useUi = false;
        this.requiredFirmwareCoins = [coinInfo];
    }

    get requiredPermissions(): PermissionRequest[] {
        return [];
    }

    get info() {
        return `Compose PSBT transaction`;
    }

    run() {
        const tx = parsePsbt({
            psbtTransactionData: this.params.psbtData,
            network: this.params.coinInfo.network,
            addresses: this.params.account.addresses,
            utxos: this.params.account.utxo,
        });

        return Promise.resolve(tx);
    }
}
