import {
    type BitcoinNetworkInfo,
    type ComposePsbtParams,
    type PermissionRequest,
} from '@trezor/connect-common';

import type { MethodMessage } from '../core/AbstractMethod';
import { AbstractMethod } from '../core/AbstractMethod';
import { getBitcoinNetworkOrThrow } from '../data/coinInfo';
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
        validateParams(payload.account, [
            { name: 'addresses', type: 'object', required: true },
            // an empty utxo set is a valid shape; parsePsbt then throws the precise
            // "Utxo not found" for any input that is not owned by the account.
            { name: 'utxo', type: 'array', required: true, allowEmpty: true },
        ]);
        // `type: 'object'` also accepts arrays, so validate the address sub-arrays that
        // parsePsbt dereferences (`addresses.used`/`unused`/`change`) to reject a malformed
        // `addresses` up front instead of leaking a raw TypeError to the caller.
        validateParams(payload.account.addresses, [
            { name: 'used', type: 'array', required: true, allowEmpty: true },
            { name: 'unused', type: 'array', required: true, allowEmpty: true },
            { name: 'change', type: 'array', required: true, allowEmpty: true },
        ]);

        const coinInfo = getBitcoinNetworkOrThrow(payload.coin);

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
