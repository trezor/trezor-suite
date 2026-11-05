/**
 * @trezor/ward/relay — the RELAY CONTRACT between `wardd` and every host library that talks to a
 * Trezor (Connect, HWI). See `packages/wardd/relay.md` for the prose.
 *
 * wardd holds all the WARD logic: the flows (sync, lookup, update), the proofs, the storage and the
 * WARD Manager. A host library only moves messages between wardd and the device, on the device
 * session it already holds, and answers the device's mid-call WARDProofRequest by asking wardd.
 *
 * Protobuf messages travel by NAME with a JSON body (bytes as lowercase hex, absent fields omitted),
 * so a host library needs no WARD logic: it maps a name to its own message type where it writes to
 * the device. Pure types, no runtime dependencies, so Connect can import them without wardd.
 */

export const RELAY_PROTOCOL_VERSION = '1.0';

/** A protobuf message by name, JSON body, bytes as hex. */
export type RelayMessage = { name: string; message: Record<string, unknown> };

/**
 * Send one message on the host library's device session and return what the device finally
 * answered. A WARDProofRequest the device raises meanwhile is NOT returned: the host library
 * answers it itself, through `answerProofRequest` on the same endpoint. A device `Failure` is returned as
 * `{ name: 'Failure', message: { code, message } }`, never thrown.
 */
export type RelayDevice = (message: RelayMessage) => Promise<RelayMessage>;

export type RelayMethod =
    /** Handshake, WebSocket only: `{ version, token }` -> `{ version, wardd }`. First frame. */
    | 'hello'
    /** Conversation: `{ wardId? }` -> `{ wardId, counter, root }`. Adopts the WM head on the device. */
    | 'sync'
    /** Conversation: `{ appId, address, networkSymbol, wardId? }` -> `RelayLookupResult`. */
    | 'lookup'
    /** Conversation: `{ appId, address, networkSymbol, metadata?, delete?, wardId? }` -> `RelayUpdateResult`. */
    | 'update'
    /** Answer one device pull: `{ request }` (a WARDProofRequest body) -> a WARDProofAck body. */
    | 'answerProofRequest'
    /** `{}` -> `{ wardId, counter, root }` of the wallet this endpoint last synced. */
    | 'status';

/** The methods that are conversations: wardd drives the device through `RelayDevice`. */
export const RELAY_CONVERSATIONS: readonly RelayMethod[] = ['sync', 'lookup', 'update'];

export type RelaySyncResult = { wardId: string; counter: number; root: string };

export type RelayLookupResult = {
    wardId: string;
    /** the device's verdict on the proof wardd served, against the adopted root */
    valid: boolean;
    isMember: boolean;
    counter: number;
    /** the host-side label wardd stores for the entry; only when the device proved membership */
    metadata?: Record<string, unknown>;
};

export type RelayUpdateResult = {
    wardId: string;
    counter: number;
    root: string;
    /** the WM head moved on first; nothing was installed and the device's candidate was discarded */
    conflict?: boolean;
    /** the device installed the change but wardd could not store it; resync before the next write */
    localCacheError?: string;
};

export type RelayErrorCode =
    | 'bad_request'
    | 'unauthorised'
    | 'version_mismatch'
    /** `answerProofRequest` or `status` before any `sync` told wardd which wallet this endpoint is on */
    | 'no_store'
    /** the device answered a deviceCall with `Failure`, or the device could not be reached */
    | 'device_failure'
    /** the device's ward_id differs from the one the caller asked for */
    | 'ward_id_mismatch'
    | 'internal';

export class RelayFailure extends Error {
    constructor(
        readonly code: RelayErrorCode,
        message: string,
    ) {
        super(message);
        this.name = 'RelayFailure';
    }
}

/**
 * One client's connection to wardd. Its state is the wallet it last synced (`answerProofRequest` and
 * `status` act on that wallet), so each host-library call that drives the device uses its own.
 */
export interface WardRelayEndpoint {
    call(
        method: RelayMethod,
        params?: Record<string, unknown>,
        device?: RelayDevice,
    ): Promise<Record<string, unknown>>;
    close(): void;
}

/** Where a host library gets endpoints: wardd in-process, or a WebSocket client to a running wardd. */
export interface WardRelay {
    connect(): Promise<WardRelayEndpoint>;
    dispose?(): void | Promise<void>;
}

// --- WebSocket framing -------------------------------------------------------------------------
//
//     client -> wardd  { id, method, params }                  a call
//     wardd  -> client { id, deviceCall: { name, message } }   "send this to the device"
//     client -> wardd  { id, deviceReply: { name, message } }  the device's final answer
//     wardd  -> client { id, result } | { id, error }          the call is over

export type RelayCallFrame = { id: number; method: RelayMethod; params?: Record<string, unknown> };
export type RelayDeviceReplyFrame = { id: number; deviceReply: RelayMessage };
export type RelayDeviceCallFrame = { id: number; deviceCall: RelayMessage };
export type RelayResultFrame = { id: number; result: Record<string, unknown> };
export type RelayErrorFrame = { id: number; error: { code: string; message: string } };

export type RelayClientFrame = RelayCallFrame | RelayDeviceReplyFrame;
export type RelayServerFrame = RelayDeviceCallFrame | RelayResultFrame | RelayErrorFrame;

/**
 * The relay's canonical form: ABSENT FIELDS ARE OMITTED. Connect's protobuf decoder yields `null`
 * for an absent scalar and `{}` for an absent submessage; the encoder refuses `null`, and a WARD
 * leaf part with an empty second arm (`{ encrypted: {...}, plaintext: {} }`) reads as both arms. So
 * everything crossing between a codec and the relay goes through here: nulls and empty NESTED
 * objects go. Empty lists stay (Connect's schemas require repeated fields), and the top-level
 * object stays even when empty (`WARDSync {}` is a message).
 */
export const stripAbsent = (value: unknown): any => {
    const strip = (v: unknown, nested: boolean): unknown => {
        if (Array.isArray(v)) return v.map(item => strip(item, false)).filter(i => i !== undefined);
        if (v && typeof v === 'object') {
            const entries = Object.entries(v)
                .map(([k, inner]) => [k, strip(inner, true)] as const)
                .filter(([, inner]) => inner !== undefined);

            return entries.length || !nested ? Object.fromEntries(entries) : undefined;
        }

        return v === null ? undefined : v;
    };

    return strip(value, false);
};
