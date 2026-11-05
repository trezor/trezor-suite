/**
 * The WARD adapter: Connect's whole part in WARD. wardd (given in-process through the `wardd`
 * setting) holds every flow, proof, store and WM call; this only does what only Connect can --
 * put wardd's messages on THIS device session and hand back the device's answers.
 *
 * Two hooks, the same in every host library (HWI has the twin in trezorlib `ward_relay`):
 *
 *   relay             wardd's next deviceCall -> the device -> its final answer back to wardd
 *   onProofRequest    the device's mid-call WARDProofRequest -> wardd `answerProofRequest` -> WARDProofAck
 *
 * NO WARD LOGIC HERE: which message comes next, what a reply means, and what to store are wardd's.
 */
import { ERRORS } from '@trezor/connect-common/src/constants';
import {
    type RelayDevice,
    RelayFailure,
    type RelayMethod,
    type WardRelay,
    type WardRelayEndpoint,
    stripAbsent,
} from '@trezor/ward';

import * as settingsStore from '../../data/settingsStore';
import type { DeviceCommands } from '../../device/DeviceCommands';

type Cmd = ReturnType<typeof DeviceCommands>;

const requireWardd = (method: string): WardRelay => {
    const wardd = settingsStore.get('wardd');
    if (!wardd) {
        throw ERRORS.TypedError(
            'Runtime',
            `${method} requires wardd to be set via TrezorConnect.init()`,
        );
    }

    return wardd;
};

/** wardd's refusals surface as Connect errors, naming the relay's code. */
const asConnectError = (error: unknown) =>
    error instanceof RelayFailure
        ? ERRORS.TypedError('Runtime', `wardd ${error.code}: ${error.message}`)
        : error;

/**
 * Lend this device session to wardd for `fn`: `relay` carries wardd's messages, and the device's
 * pulls are answered from the same endpoint for as long as `fn` runs.
 */
export const withWard = async <T>(
    cmd: Cmd,
    method: string,
    fn: (endpoint: WardRelayEndpoint, relay: RelayDevice) => Promise<T>,
): Promise<T> => {
    const endpoint = await requireWardd(method).connect();

    // A device Failure is wardd's to see -- it ends the conversation -- so it goes back as a
    // `Failure` message rather than ending the call here.
    const relay: RelayDevice = async ({ name, message }) => {
        try {
            const res = await cmd.relayCall(name, stripAbsent(message));

            return { name: res.type, message: stripAbsent(res.message) };
        } catch (error) {
            if (error instanceof ERRORS.TrezorError) {
                return { name: 'Failure', message: { code: error.code, message: error.message } };
            }
            throw error;
        }
    };

    cmd.setWardProofCallback(async request =>
        stripAbsent(await endpoint.call('answerProofRequest', { request: stripAbsent(request) })),
    );
    try {
        return await fn(endpoint, relay);
    } catch (error) {
        throw asConnectError(error);
    } finally {
        cmd.setWardProofCallback(undefined);
        endpoint.close();
    }
};

/** One wardd conversation (`sync`, `lookup`, `update`) on this device session. */
export const callWard = <T>(
    cmd: Cmd,
    method: string,
    relayMethod: RelayMethod,
    params: Record<string, unknown>,
) =>
    withWard(
        cmd,
        method,
        async (endpoint, relay) => (await endpoint.call(relayMethod, params, relay)) as T,
    );
