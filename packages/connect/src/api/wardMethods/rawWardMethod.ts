import type {
    CallMethodPayload,
    MethodPermission,
    UiRequestConfirmation,
} from '@trezor/connect-common';
import { Assert, type TSchema } from '@trezor/schema-utils';

import type { MethodMessage } from '../../core/AbstractMethod';
import { AbstractMethod } from '../../core/AbstractMethod';

/**
 * This directory (api/wardMethods/) holds only the thin `AbstractMethod` wire-protocol
 * shells for the AuthDB methods — they stay in @trezor/connect because they depend on
 * connect-internal device/session/UI machinery (AbstractMethod, settingsStore) that isn't
 * part of connect's public export surface. The portable Merkle-tree logic and the
 * WARD data-provider contract lives in the separate @trezor/ward package, following the
 * same split as authenticateDevice.ts (shell, here) + @trezor/device-authenticity (logic).
 */

/**
 * The single-message low-level AuthDB methods (wardLookup, wardSetRoot) are thin
 * passthroughs to one proto request/response pair with no per-method business logic.
 * This factory produces a MethodClass for one of them, removing the identical
 * constructor/run() boilerplate. (wardInit and wardUpdate/VerifyAddress are
 * multi-message orchestrations and are hand-written AbstractMethod classes instead.)
 *
 * Wire message names default to PascalCase(name) + 'Response'. Since the firmware
 * migrated Ward* to WARD, the current callers pass explicit requestType/responseType
 * (e.g. wardLookup -> 'WARDLookup'/'WARDLookupAck'); the default derivation is kept
 * for any future method whose wire names follow the PascalCase+'Response' convention.
 */
type RawWardMethodConfig<Name extends CallMethodPayload['method']> = {
    name: Name;
    /** Proto schema to validate the incoming payload against. */
    schema: TSchema;
    /** Builds the wire params from the validated payload. */
    buildParams: (payload: any) => Record<string, unknown>;
    /**
     * Wire request message name. Defaults to PascalCase(name). Callers override it when
     * the wire name doesn't follow that convention — e.g. wardLookup maps to the
     * renamed 'WARDLookup', with ack 'WARDLookupAck' rather than a 'Response' suffix.
     */
    requestType?: string;
    /** Wire response message name. Defaults to `${requestType}Response`. */
    responseType?: string;
    /** Defaults to true; wardLookup sets it false (a read-only lookup needs no passphrase). */
    useEmptyPassphrase?: boolean;
    info?: string;
    confirmation?: UiRequestConfirmation['payload'];
};

export const createRawWardMethod = <Name extends CallMethodPayload['method']>(
    config: RawWardMethodConfig<Name>,
) => {
    const requestType =
        config.requestType ?? config.name.charAt(0).toUpperCase() + config.name.slice(1);
    const responseType = config.responseType ?? `${requestType}Response`;

    return class RawWardMethod extends AbstractMethod<Name, Record<string, unknown>> {
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
            // requestType/responseType are plain strings, not literals from the typedCall
            // overload union — the cast is safe because config.schema/name pairs are only
            // ever constructed for the known AuthDB/WARD wire messages.
            const response = await cmd.typedCall(
                requestType as any,
                responseType as any,
                this.params,
            );

            return response.message;
        }
    };
};
