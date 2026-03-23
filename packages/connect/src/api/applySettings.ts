// origin: https://github.com/trezor/connect/blob/develop/src/js/core/methods/ApplySettings.js

import type { MessagesSchema as PROTO } from '@trezor/protobuf';
import { Assert } from '@trezor/schema-utils';

import type { MethodMessage, MethodPermission } from '../core/AbstractMethod';
import { AbstractMethod } from '../core/AbstractMethod';
import { ApplySettings as ApplySettingsSchema } from '../types/api/applySettings';

export default class ApplySettings extends AbstractMethod<'applySettings', PROTO.ApplySettings> {
    constructor(message: MethodMessage<'applySettings'>) {
        super(message);
        this.useDeviceState = false;
        this.skipFinalReload = false;
    }

    get requiredPermissions(): MethodPermission[] {
        return ['management'];
    }

    init() {
        const { payload } = this;

        Assert(ApplySettingsSchema, payload);

        this.params = {
            ...payload,
            _passphrase_source: payload.passphrase_source,
        };
    }

    get confirmation() {
        return {
            view: 'device-management' as const,
            customConfirmButton: {
                className: 'confirm',
                label: 'Proceed',
            },
            label: 'Do you really want to change device settings?',
        };
    }

    async run() {
        const cmd = this.getDevice().getCommands();

        // https://github.com/trezor/trezor-firmware/pull/5015
        // homescreen bytes are streamed in smaller data chunks
        const homescreenBytes = this.params.homescreen
            ? Buffer.from(this.params.homescreen, 'hex')
            : undefined;
        if (this.getDevice().atLeast('2.9.0') && homescreenBytes) {
            // cannot use both. Failure: Mutually exclusive settings
            this.params.homescreen = undefined;
            this.params.homescreen_length = homescreenBytes.length;
        }

        let response = await cmd.typedCall(
            'ApplySettings',
            ['DataChunkRequest', 'Success'],
            this.params,
        );

        while (response.type !== 'Success') {
            const start = response.message.data_offset;
            const end = start + response.message.data_length;
            const data_chunk = homescreenBytes?.subarray(start, end).toString('hex') || '';

            response = await cmd.typedCall('DataChunkAck', ['DataChunkRequest', 'Success'], {
                data_chunk,
            });
        }

        return response.message;
    }
}
