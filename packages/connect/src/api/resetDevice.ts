// origin: https://github.com/trezor/connect/blob/develop/src/js/core/methods/ResetDevice.js
import { Assert } from '@trezor/schema-utils';
import { getRandomInt } from '@trezor/utils';

import { generateEntropy, verifyEntropy } from '../api/firmware/verifyEntropy';
import { ERRORS, PROTO } from '../constants';
import { AbstractMethod } from '../core/AbstractMethod';
import { UI } from '../events';
import { getFirmwareRange } from './common/paramsValidator';
import { validatePath } from '../utils/pathUtils';

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

    // https://github.com/trezor/trezor-firmware/blob/57868ad48f4c462bb1f4fa57572067e89a039a60/docs/common/message-workflows.md#simple-resetdevice-workflow
    private async resetDeviceWorkflow() {
        const cmd = this.device.getCommands();
        const entropy = generateEntropy(32).toString('hex');

        // ResetDevice > EntropyRequest > EntropyAck > Success (old fw)
        await cmd.typedCall('ResetDevice', 'EntropyRequest', this.params);
        await cmd.typedCall('EntropyAck', 'Success', { entropy });
    }

    // https://github.com/trezor/trezor-firmware/blob/57868ad48f4c462bb1f4fa57572067e89a039a60/docs/common/message-workflows.md#entropy-check-workflow
    private async entropyCheckWorkflow() {
        const cmd = this.device.getCommands();
        const paths = ["m/84'/0'/0'", "m/44'/60'/0'"] as const;

        // error.message should be one of these https://github.com/trezor/trezor-suite/blob/develop/packages/transport/src/transports/abstract.ts#L59
        const handleErr = (error: any) => {
            throw error.cause === 'transport-error'
                ? error
                : ERRORS.TypedError('Failure_EntropyCheck', error.message);
        };

        // steps: 1 - 4
        // ResetDevice > EntropyRequest > EntropyAck > EntropyCheckReady (new fw)
        // note: these calls are intentionally excluded from the catch error handling because it is not in the 'critical' phase yet
        let entropy = generateEntropy(32).toString('hex');
        let commitment = await cmd
            .typedCall('ResetDevice', 'EntropyRequest', this.params)
            .then(response => response.message.entropy_commitment);

        await cmd.typedCall('EntropyAck', 'EntropyCheckReady', { entropy });

        const tries = getRandomInt(1, 5);
        for (let i = 0; i < tries; i++) {
            // steps: 5 - 6
            // GetPublicKey > PublicKey > EntropyCheckContinue > EntropyRequest > EntropyAck > EntropyCheckReady

            const xpubs: Record<string, string> = {}; // <path, xpub>
            for (const path of paths) {
                const pubKey = await cmd
                    .getPublicKey({ address_n: validatePath(path) })
                    .catch(handleErr);
                xpubs[path] = pubKey.xpub;
            }

            const { prev_entropy, entropy_commitment } = await cmd
                .typedCall('EntropyCheckContinue', 'EntropyRequest', {})
                .then(response => response.message)
                .catch(handleErr);

            const res = await verifyEntropy({
                type: this.params.backup_type,
                strength: this.params.strength,
                commitment,
                hostEntropy: entropy,
                trezorEntropy: prev_entropy,
                xpubs,
            });

            if (res.error) {
                await this.device.getCurrentSession().cancelCall();
                throw ERRORS.TypedError('Failure_EntropyCheck', res.error);
            }

            entropy = generateEntropy(32).toString('hex');
            commitment = entropy_commitment;

            await cmd.typedCall('EntropyAck', 'EntropyCheckReady', { entropy }).catch(handleErr);
        }

        // step 7 EntropyCheckContinue > Success
        // wallet backup flow may follow after successful entropy check, so don't consider errors thrown there as entropy check failure
        await cmd.typedCall('EntropyCheckContinue', 'Success', { finish: true });
    }

    async run() {
        if (this.params.entropy_check && this.device.unavailableCapabilities['entropyCheck']) {
            // entropy check requested but not supported by the firmware
            this.params.entropy_check = false;
        }

        if (this.params.entropy_check) {
            await this.entropyCheckWorkflow();
        } else {
            await this.resetDeviceWorkflow();
        }

        return { message: 'Success' };
    }
}
