// origin: https://github.com/trezor/connect/blob/develop/src/js/core/methods/TezosGetAddress.js

import type { MethodMessage } from '../../../core/AbstractMethod';
import { getMiscNetwork } from '../../../data/coinInfo';
import { AbstractMiscGetAddress } from '../../common/AbstractMiscGetAddress';
import type { MiscGetAddressParams } from '../../common/AbstractMiscGetAddress';

export default class TezosGetAddress extends AbstractMiscGetAddress<'tezosGetAddress'> {
    constructor(message: MethodMessage<'tezosGetAddress'>) {
        super(message, 3);
        this.requiredDeviceCapabilities = ['Capability_Tezos'];
        this.requiredFirmwareCoins = [getMiscNetwork('Tezos')];
    }

    get info() {
        return this.getInfo('Tezos', true);
    }

    get confirmation() {
        return this.getConfirmation('Tezos');
    }

    async _call({ proto }: MiscGetAddressParams) {
        const cmd = this.getDevice().getCommands();
        const response = await cmd.typedCall('TezosGetAddress', 'TezosAddress', proto);

        return response.message;
    }
}
