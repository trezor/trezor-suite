/**
 * THE RELAY CONTRACT between `wardd` and every integration (Connect, HWI, BHWI/async-hwi, Lark).
 * See `relay.md` for the prose. Versioned: a client and wardd that disagree on the major version
 * refuse each other at `hello`.
 *
 * Transport: one WebSocket on 127.0.0.1, text frames, one JSON object per frame. Protobuf messages
 * travel by NAME with a JSON body (bytes as lowercase hex), so a binding needs no WARD definitions:
 * it maps `name` to its own message-type ID only at the frame pipe.
 *
 *     client -> wardd  { id, method, params }                  a call
 *     wardd  -> client { id, deviceCall: { name, message } }   "send this to the device"
 *     client -> wardd  { id, deviceReply: { name, message } }  the device's answer (pulls included)
 *     wardd  -> client { id, result } | { id, error }          the call is over
 *
 * One call is one CONVERSATION: while it runs the client holds its device session exclusively,
 * and every `deviceCall` for that `id` is answered with exactly one `deviceReply` before wardd
 * sends the next. A device-initiated pull (WardEntryRequest, WardChainRequest) is simply a
 * `deviceReply` whose name is the pull; wardd answers it with the next `deviceCall`.
 */

export const RELAY_PROTOCOL_VERSION = '1.0';

/** A protobuf message by name, JSON body, bytes as hex. */
export interface RelayMessage {
    name: string;
    message: Record<string, unknown>;
}

export type RelayMethod =
    /** Handshake: `{ version, token }` -> `{ version, wardd }`. First frame on every socket. */
    | 'hello'
    /** Open the wallet's replica: `{ wardId, evoluNode }` (hex) -> `{ counter, root }`. */
    | 'openStore'
    /** Answer one pull outside a conversation: `{ request, staged? }` -> WardEntryAck body. */
    | 'serveEntry'
    /** Apply a device result (WardLeafAck / WardFlushQueueAck body) and publish it to the WM. */
    | 'applyResult'
    /** Conversation: sync the device's head with the WM (reconcile, or catch up via the chain). */
    | 'sync'
    /** Conversation: flush the offline queue, `{ maxBatch? }`, then publish and sync. */
    | 'flush'
    /** `{}` -> `{ counter, root, wmCounter, wmRoot }`. */
    | 'status';

export interface RelayCall {
    id: number;
    method: RelayMethod;
    params: Record<string, unknown>;
}

export interface RelayDeviceCall {
    id: number;
    deviceCall: RelayMessage;
}

export interface RelayDeviceReply {
    id: number;
    deviceReply: RelayMessage;
}

export interface RelayResult {
    id: number;
    result: Record<string, unknown>;
}

export type RelayErrorCode =
    | 'bad_request'
    | 'unauthorised'
    | 'version_mismatch'
    | 'no_store'
    | 'device_failure'
    | 'wm_conflict'
    /** The WM holds a head BELOW the device's: its register regressed. Needs a rollback. */
    | 'wm_behind'
    /** The device's head is off the WM's history (a fork); `sync` with `{ rejoin: true }`. */
    | 'needs_rejoin'
    | 'internal';

export interface RelayError {
    id: number;
    error: { code: RelayErrorCode; message: string };
}

export type ClientFrame = RelayCall | RelayDeviceReply;
export type WarddFrame = RelayDeviceCall | RelayResult | RelayError;

export const isDeviceCall = (f: WarddFrame): f is RelayDeviceCall => 'deviceCall' in f;
export const isResult = (f: WarddFrame): f is RelayResult => 'result' in f;
export const isError = (f: WarddFrame): f is RelayError => 'error' in f;
