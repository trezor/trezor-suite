import type { MethodMessage } from '../../../core/AbstractMethod';
import { getMiscNetwork } from '../../../data/coinInfo';
import { AbstractMiscGetAddress } from '../../common/AbstractMiscGetAddress';
import type { MiscGetAddressParams } from '../../common/AbstractMiscGetAddress';

export default class SolanaGetAddress extends AbstractMiscGetAddress<'solanaGetAddress'> {
    constructor(message: MethodMessage<'solanaGetAddress'>) {
        super(message, 2);
        this.requiredDeviceCapabilities = ['Capability_Solana'];
        this.requiredFirmwareCoins = [getMiscNetwork('Solana')];
    }

    get info() {
        return this.getInfo('Solana', false);
    }

    get confirmation() {
        return this.getConfirmation('Solana');
    }

    async _call({ proto }: MiscGetAddressParams) {
        const cmd = this.getDevice().getCommands();
        const response = await cmd.typedCall('SolanaGetAddress', 'SolanaAddress', proto);

        return response.message;
    }
}
