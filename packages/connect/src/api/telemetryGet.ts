import { MessagesSchema as PROTO } from '@trezor/protobuf';
import { Assert } from '@trezor/schema-utils';

import { AbstractMethod } from '../core/AbstractMethod';

export default class TelemetryGet extends AbstractMethod<'telemetryGet', PROTO.TelemetryGet> {
    init() {
        this.requiredPermissions = ['management'];
        this.useDeviceState = false;
        const { payload } = this;

        Assert(PROTO.TelemetryGet, payload);

        this.params = {
            ...payload,
        };
    }

    async run() {
        const cmd = this.device.getCommands();

        const response = await cmd.typedCall('TelemetryGet', 'Telemetry', this.params);

        return response.message;
    }
}
