import { type MethodPermission } from '@trezor/connect-common';
import { MessagesSchema as PROTO } from '@trezor/protobuf';
import { Assert } from '@trezor/schema-utils';

import type { MethodMessage } from '../core/AbstractMethod';
import { AbstractMethod } from '../core/AbstractMethod';

export default class TelemetryGet extends AbstractMethod<'telemetryGet', PROTO.TelemetryGet> {
    constructor(message: MethodMessage<'telemetryGet'>) {
        const { payload } = message;

        Assert(PROTO.TelemetryGet, payload);

        const params = { ...payload };

        super(message, params);
        this.useDeviceState = false;
    }
    get requiredPermissions(): MethodPermission[] {
        return ['management'];
    }

    async run() {
        const cmd = this.getDevice().getCommands();

        const response = await cmd.typedCall('TelemetryGet', 'Telemetry', this.params);

        return response.message;
    }
}
