import type {
    CallMethodPayload,
    MethodPermission,
    UiRequestConfirmation,
} from '@trezor/connect-common';
import { Assert, type TSchema } from '@trezor/schema-utils';

import type { MethodMessage } from '../../core/AbstractMethod';
import { AbstractMethod } from '../../core/AbstractMethod';

/**
 * This directory (api/authDbMethods/) holds only the thin `AbstractMethod` wire-protocol
 * shells for the AuthDB methods — they stay in @trezor/connect because they depend on
 * connect-internal device/session/UI machinery (AbstractMethod, settingsStore) that isn't
 * part of connect's public export surface. The portable Merkle-tree logic and the
 * AuthLabelProvider contract live in the separate @trezor/authdb package, following the
 * same split as authenticateDevice.ts (shell, here) + @trezor/device-authenticity (logic).
 */

/**
 * The three low-level AuthDB methods (authDbLookup, authDbSetRoot, authDbUpdateLeaf) are
 * thin passthroughs to a single proto request/response pair with no per-method business
 * logic. This factory produces a MethodClass for one of them, removing the identical
 * constructor/run() boilerplate.
 *
 * Wire message names are derived from `name` (PascalCase + optional 'Response' suffix)
 * since all three already follow that convention — e.g. 'authDbLookup' maps to the
 * 'AuthDbLookup'/'AuthDbLookupResponse' proto messages.
 */
type RawAuthDbMethodConfig<Name extends CallMethodPayload['method']> = {
    name: Name;
    /** Proto schema to validate the incoming payload against. */
    schema: TSchema;
    /** Builds the wire params from the validated payload. */
    buildParams: (payload: any) => Record<string, unknown>;
    /** Defaults to true, matching five of the six existing methods (authDbLookup is the one exception). */
    useEmptyPassphrase?: boolean;
    info?: string;
    confirmation?: UiRequestConfirmation['payload'];
};

export const createRawAuthDbMethod = <Name extends CallMethodPayload['method']>(
    config: RawAuthDbMethodConfig<Name>,
) => {
    const requestType = config.name.charAt(0).toUpperCase() + config.name.slice(1);
    const responseType = `${requestType}Response`;

    return class RawAuthDbMethod extends AbstractMethod<Name, Record<string, unknown>> {
        constructor(message: MethodMessage<Name>) {
            const { payload } = message;
            Assert(config.schema, payload);

            const params = config.buildParams(payload);

            super(message, params);
            this.useDeviceState = false;
            this.useEmptyPassphrase = config.useEmptyPassphrase ?? true;
        }

        get requiredPermissions(): MethodPermission[] {
            return ['management'];
        }

        get confirmation() {
            return config.confirmation;
        }

        get info() {
            return config.info ?? '';
        }

        async run() {
            const cmd = this.getDevice().getCommands();
            // requestType/responseType are derived strings, not literals from the typedCall
            // overload union — the cast is safe because config.schema/name pairs are only
            // ever constructed for the six known AuthDB wire messages below.
            const response = await cmd.typedCall(
                requestType as any,
                responseType as any,
                this.params,
            );

            return response.message;
        }
    };
};
