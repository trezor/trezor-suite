import type { MethodPermission } from '@trezor/connect-common';
import { ERRORS } from '@trezor/connect-common/src/constants';

import type { MethodMessage } from '../../core/AbstractMethod';
import { AbstractMethod } from '../../core/AbstractMethod';

// Tracer-bullet experimental method. Demonstrates the wiring without touching a device.
// To add a real experimental method, copy this file, register the name in
// `connectExperimentalCallableMethods` (packages/connect-common/src/callableMethods.ts),
// declare its type in `packages/connect-common/src/types/api/<name>.ts`, add it to
// `TrezorConnectExperimental` in `packages/connect-common/src/types/api/index.ts`,
// and re-export the class from `packages/connect/src/api/index.ts`.

type Params = { message: string };

export default class ExperimentalEcho extends AbstractMethod<'experimentalEcho', Params> {
    constructor(message: MethodMessage<'experimentalEcho'>) {
        const { payload } = message;

        if (typeof payload.message !== 'string') {
            throw ERRORS.TypedError(
                'Method_InvalidParameter',
                'experimentalEcho: `message` must be a string',
            );
        }

        super(message, { message: payload.message });
        this.useDevice = false;
        this.useDeviceState = false;
        this.useUi = false;
    }

    get requiredPermissions(): MethodPermission[] {
        return [];
    }

    run() {
        return Promise.resolve({
            echo: this.params.message,
            receivedAt: Date.now(),
        });
    }
}
