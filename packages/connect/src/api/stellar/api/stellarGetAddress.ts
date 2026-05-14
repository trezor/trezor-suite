// origin: https://github.com/trezor/connect/blob/develop/src/js/core/methods/StellarGetAddress.js

import type { MethodMessage } from '../../../core/AbstractMethod';
import { getMiscNetwork } from '../../../data/coinInfo';
import { AbstractMiscGetAddress } from '../../common/AbstractMiscGetAddress';
import type { MiscGetAddressParams } from '../../common/AbstractMiscGetAddress';

export default class StellarGetAddress extends AbstractMiscGetAddress<'stellarGetAddress'> {
    constructor(message: MethodMessage<'stellarGetAddress'>) {
        super(message, 3);
        this.requiredDeviceCapabilities = ['Capability_Stellar'];
        this.requiredFirmwareCoins = [getMiscNetwork('Stellar')];
    }

    get info() {
        return this.getInfo('Stellar', true);
    }

    get confirmation() {
        return this.getConfirmation('Stellar');
    }

    async _call({ proto }: MiscGetAddressParams) {
        const cmd = this.getDevice().getCommands();
        const response = await cmd.typedCall('StellarGetAddress', 'StellarAddress', proto);

        return response.message;
    }
}
