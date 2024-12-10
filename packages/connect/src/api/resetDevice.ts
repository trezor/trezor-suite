// origin: https://github.com/trezor/connect/blob/develop/src/js/core/methods/ResetDevice.js
import { Assert } from '@trezor/schema-utils';
import { getRandomInt } from '@trezor/utils';

import { AbstractMethod } from '../core/AbstractMethod';
import { UI } from '../events';
import { getFirmwareRange } from './common/paramsValidator';
import { PROTO, ERRORS } from '../constants';
import { validatePath } from '../utils/pathUtils';
import { generateEntropy, verifyEntropy } from '../api/firmware/verifyEntropy';
import { cancelPrompt } from '../device/prompts';

type EntropyRequestData = PROTO.EntropyRequest & { host_entropy: string };

export default class ResetDevice extends AbstractMethod<'resetDevice', PROTO.ResetDevice> {
    init() {
        this.allowDeviceMode = [UI.INITIALIZE, UI.SEEDLESS];
        this.useDeviceState = false;
        this.requiredPermissions = ['management'];
        this.firmwareRange = getFirmwareRange(this.name, null, this.firmwareRange);

        const { payload } = this;
        // validate bundle type
        Assert(PROTO.ResetDevice, payload);

        this.params = {
            strength: payload.strength || 256,
            passphrase_protection: payload.passphrase_protection,
            pin_protection: payload.pin_protection,
            language: payload.language,
            label: payload.label,
            u2f_counter: payload.u2f_counter || Math.floor(Date.now() / 1000),
            skip_backup: payload.skip_backup,
            no_backup: payload.no_backup,
            backup_type: payload.backup_type,
            entropy_check:
                typeof payload.entropy_check === 'boolean' ? payload.entropy_check : true,
        };
    }

    get info() {
        return 'Setup device';
    }

    get confirmation() {
        return {
            view: 'device-management' as const,
            label: 'Do you really you want to create a new wallet?',
        };
    }

    // generate host_entropy and then call workflow:
    // - ResetDevice > EntropyRequest > EntropyAck
    // - EntropyCheckContinue > EntropyRequest > EntropyAck
    private async getEntropyData(
        type: 'ResetDevice' | 'EntropyCheckContinue',
    ): Promise<EntropyRequestData> {
        const cmd = this.device.getCommands();
        const entropy = generateEntropy(32).toString('hex');
        const params = type === 'ResetDevice' ? this.params : {};
        const entropyRequest = await cmd.typedCall(type, 'EntropyRequest', params);
        // EntropyAck > Success if this.params.entropy_check === false
        await cmd.typedCall('EntropyAck', ['EntropyCheckReady', 'Success'], { entropy });

        return {
            ...entropyRequest.message,
            host_entropy: entropy,
        };
    }

    private async entropyCheck(prevData: EntropyRequestData): Promise<EntropyRequestData> {
        const cmd = this.device.getCommands();
        const paths = ["m/84'/0'/0'", "m/44'/60'/0'"];
        const xpubs: Record<string, string> = {}; // <path, xpub>
        for (let i = 0; i < paths.length; i++) {
            const p = paths[i];
            const pubKey = await cmd.getPublicKey({ address_n: validatePath(p) });
            xpubs[p] = pubKey.xpub;
        }

        const currentData = await this.getEntropyData('EntropyCheckContinue');
        const res = await verifyEntropy({
            type: this.params.backup_type,
            strength: this.params.strength,
            commitment: prevData.entropy_commitment,
            hostEntropy: prevData.host_entropy,
            trezorEntropy: currentData.prev_entropy,
            xpubs,
        });
        if (res.error) {
            await cancelPrompt(this.device);
            throw ERRORS.TypedError('Failure_EntropyCheck', res.error);
        }

        return currentData;
    }

    async run() {
        const cmd = this.device.getCommands();

        if (this.params.entropy_check && this.device.unavailableCapabilities['entropyCheck']) {
            // entropy check requested but not supported by the firmware
            this.params.entropy_check = false;
        }
        // Entropy check workflow:
        // https://github.com/trezor/trezor-firmware/blob/57868ad48f4c462bb1f4fa57572067e89a039a60/docs/common/message-workflows.md#entropy-check-workflow
        // steps: 1 - 4
        // ResetDevice > EntropyRequest > EntropyAck > EntropyCheckReady (new fw) || Success (old fw)
        let entropyData = await this.getEntropyData('ResetDevice');

        if (this.params.entropy_check) {
            const tries = getRandomInt(1, 5);
            for (let i = 0; i < tries; i++) {
                // steps: 5 - 6
                // GetPublicKey > ResetDeviceContinue > EntropyRequest > EntropyAck > EntropyCheckReady
                entropyData = await this.entropyCheck(entropyData);
            }
            // step 7 EntropyCheckContinue > Success
            await cmd.typedCall('EntropyCheckContinue', 'Success', { finish: true });
        }

        return { message: 'Success' };
    }
}
