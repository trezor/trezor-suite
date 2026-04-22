// origin: https://github.com/trezor/connect/blob/develop/src/js/core/methods/RippleGetAddress.js

import type { MethodMessage } from '../../../core/AbstractMethod';
import { getMiscNetwork } from '../../../data/coinInfo';
import { AbstractMiscGetAddress } from '../../common/AbstractMiscGetAddress';
import type { MiscGetAddressParams } from '../../common/AbstractMiscGetAddress';

export default class RippleGetAddress extends AbstractMiscGetAddress<'rippleGetAddress'> {
    constructor(message: MethodMessage<'rippleGetAddress'>) {
        super(message, 3);
        this.requiredDeviceCapabilities = ['Capability_Ripple'];
        this.requiredFirmwareCoins = [getMiscNetwork('Ripple')];
    }

    get info() {
        return this.getInfo('Ripple', true);
    }

    get confirmation() {
        return this.getConfirmation('Ripple');
    }

    async _call({ proto }: MiscGetAddressParams) {
        const cmd = this.getDevice().getCommands();
        const response = await cmd.typedCall('RippleGetAddress', 'RippleAddress', proto);

        return response.message;
    }
}
