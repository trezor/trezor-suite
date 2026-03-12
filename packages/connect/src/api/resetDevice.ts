// origin: https://github.com/trezor/connect/blob/develop/src/js/core/methods/ResetDevice.js
import { ERRORS } from '@trezor/connect-common/src/constants';
import { TransportError } from '@trezor/connect-common/src/constants/errors';
import { Assert } from '@trezor/schema-utils';
import { getRandomInt } from '@trezor/utils';

import { generateEntropy, verifyEntropy } from '../api/firmware/verifyEntropy';
import { PROTO } from '../constants';
import { AbstractMethod, MethodContext, MethodMessage, MethodPermission } from '../core/AbstractMethod';
import { UI_REQUEST } from '../events';
import { getFirmwareRange } from './common/paramsValidator';
import { validatePath } from '../utils/pathUtils';
import { calculateXPubHashes } from './firmware/calculateXPubHash';

type XPubsPerBip43Path = Record<string, string>; // used only internally, not exported

export default class ResetDevice extends AbstractMethod<'resetDevice', PROTO.ResetDevice> {
    constructor(message: MethodMessage<'resetDevice'>, context: MethodContext) {
        super(message, context);
        this.allowDeviceMode = [UI_REQUEST.INITIALIZE, UI_REQUEST.SEEDLESS];
        this.useDeviceState = false;
        this.skipFinalReload = false;
        this.firmwareRange = getFirmwareRange(this.name, null, this.firmwareRange);
    }
    get requiredPermissions(): MethodPermission[] {
        return ['management'];
    }

    init() {
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
        const cmd = this.getDevice().getCommands();
        const entropy = generateEntropy(32).toString('hex');

        // ResetDevice > EntropyRequest > EntropyAck > Success (old fw)
        await cmd.typedCall('ResetDevice', 'EntropyRequest', this.params);
        await cmd.typedCall('EntropyAck', 'Success', { entropy });
    }

    // https://github.com/trezor/trezor-firmware/blob/57868ad48f4c462bb1f4fa57572067e89a039a60/docs/common/message-workflows.md#entropy-check-workflow
    private async entropyCheckWorkflow(): Promise<XPubsPerBip43Path> {
        const cmd = this.getDevice().getCommands();
        const paths = ["m/84'/0'/0'", "m/44'/60'/0'"] as const;
        const parsedPaths = paths.map(path => ({ path, address_n: validatePath(path) }));

        // error.message should be one of ERRORS_WITHOUT_DEVICE_INTERACTION, otherwise it could be a fake device's attempt to bypass the entropy check.
        const handleErr = (error: any) => {
            throw error instanceof TransportError
                ? error
                : ERRORS.TypedError('Failure_EntropyCheck', error.message);
        };

        const getXPubs = async () => {
            const xpubs: XPubsPerBip43Path = {};
            for (const { path, address_n } of parsedPaths) {
                const pubKey = await cmd.getPublicKey({ address_n }).catch(handleErr);
                xpubs[path] = pubKey.xpub;
            }

            return xpubs;
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

            const xpubs = await getXPubs();

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
                await this.getDevice().getCurrentSession().cancelCall();
                throw ERRORS.TypedError('Failure_EntropyCheck', res.error);
            }

            entropy = generateEntropy(32).toString('hex');
            commitment = entropy_commitment;

            await cmd.typedCall('EntropyAck', 'EntropyCheckReady', { entropy }).catch(handleErr);
        }
        const finalXPubs = await getXPubs();

        // step 7 EntropyCheckContinue > Success
        // wallet backup flow may follow after successful entropy check, so don't consider errors thrown there as entropy check failure
        await cmd.typedCall('EntropyCheckContinue', 'Success', { finish: true });

        // Entropy check success, so the xpubs are considered genuine
        return finalXPubs;
    }

    async run() {
        if (this.params.entropy_check && this.getDevice().unavailableCapabilities['entropyCheck']) {
            // entropy check requested but not supported by the firmware
            this.params.entropy_check = false;
        }

        if (this.params.entropy_check) {
            const xpubs = await this.entropyCheckWorkflow();
            const xpubHashes = calculateXPubHashes(xpubs);

            return { message: 'Success', xpubHashes };
        }

        await this.resetDeviceWorkflow();

        return { message: 'Success' };
    }
}
