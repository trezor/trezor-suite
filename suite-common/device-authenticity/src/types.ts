import { AuthenticateDeviceResult, Unsuccessful } from '@trezor/connect';

type ConnectErrorPayload = Unsuccessful['payload'];
// note: corresponds to Awaited<Response<AuthenticateDeviceResult>>['payload'] but this is IMO clearer
export type ConnectResponsePayload = AuthenticateDeviceResult | ConnectErrorPayload;

/**
 * Processed result of TrezorConnect.authenticateDevice call that we may store in the Redux state.
 * We want to:
 * 1. keep both successful response as well as error payload from the TrezorConnect call itself .
 * 2. evaluate overall `valid`, because Connect returns result for each secure element vendor (e.g. optiga & tropic)
 *    and it is up to Suite to decide which results to use.
 */
export type StoredAuthenticateDeviceResult =
    | (ConnectResponsePayload & { valid: boolean })
    | undefined;
