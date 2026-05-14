import type { MethodMessage } from '../../../core/AbstractMethod';
import { AbstractMiscGetAddress } from '../../common/AbstractMiscGetAddress';
import type { MiscGetAddressParams } from '../../common/AbstractMiscGetAddress';

export default class TronGetAddress extends AbstractMiscGetAddress<'tronGetAddress'> {
    constructor(message: MethodMessage<'tronGetAddress'>) {
        super(message, 2);
        this.requiredDeviceCapabilities = ['Capability_Tron'];
    }

    get info() {
        return this.getInfo('Tron', false);
    }

    get confirmation() {
        return this.getConfirmation('Tron');
    }

    async _call({ proto }: MiscGetAddressParams) {
        const cmd = this.getDevice().getCommands();
        const response = await cmd.typedCall('TronGetAddress', 'TronAddress', proto);

        return response.message;
    }
}
