import { MessagesSchema as PROTO } from '@trezor/protobuf';
import { Assert } from '@trezor/schema-utils';

import { AbstractMethod, MethodContext, MethodMessage, MethodPermission } from '../core/AbstractMethod';

export default class TelemetryGet extends AbstractMethod<'telemetryGet', PROTO.TelemetryGet> {
    constructor(message: MethodMessage<'telemetryGet'>, context: MethodContext) {
        super(message, context);
        this.useDeviceState = false;
    }
    get requiredPermissions(): MethodPermission[] {
        return ['management'];
    }

    init() {
        const { payload } = this;

        Assert(PROTO.TelemetryGet, payload);

        this.params = {
            ...payload,
        };
    }

    async run() {
        const cmd = this.getDevice().getCommands();

        const response = await cmd.typedCall('TelemetryGet', 'Telemetry', this.params);

        return response.message;
    }
}
