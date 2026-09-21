import type { MethodMessage } from '../../../core/AbstractMethod';
import { getMiscNetwork } from '../../../data/coinInfo';
import { TRON_MODULAR_APP } from '../../../data/modularApps/tron';
import { AbstractMiscGetAddress } from '../../common/AbstractMiscGetAddress';
import type { MiscGetAddressParams } from '../../common/AbstractMiscGetAddress';

export default class TronGetAddress extends AbstractMiscGetAddress<'tronGetAddress'> {
    constructor(message: MethodMessage<'tronGetAddress'>) {
        super(message, 2);
        this.requiredDeviceCapabilities = ['Capability_Tron'];
        this.requiredFirmwareCoins = [getMiscNetwork('trx')];
        this.requiredApp = TRON_MODULAR_APP;
    }

    get info() {
        return this.getInfo('Tron', false);
    }

    get confirmation() {
        return this.getConfirmation('Tron');
    }

    async _call({ proto }: MiscGetAddressParams) {
        const cmd = this.getDevice().getModularAppCommands(TRON_MODULAR_APP);
        const response = await cmd.typedCall('TronGetAddress', 'TronAddress', proto);

        return response.message;
    }
}
