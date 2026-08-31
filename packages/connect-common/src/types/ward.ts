import type { MessagesSchema as PROTO } from '@trezor/protobuf';

/**
 * The host side of WARD's PULL model.
 *
 * WARD is not a request/response method: firmware interrupts an in-flight call to ask the
 * host for the leaf at a keyed path (`WardEntryRequest`) and resumes once the host answers
 * (`WardEntryAck`) -- the same shape the device already uses for PIN and passphrase. This
 * type is that answerer, registered once at `TrezorConnect.init()` and reachable for the
 * whole session.
 *
 * OWNS: producing the ack for a request -- serving from whatever host storage it wraps.
 *
 * MUST NOT: talk to the device. It never sees the transport; the device layer hands it a
 * decoded request and puts its ack back on the wire.
 *
 * Protobuf in, protobuf out: the provider owns the MESSAGE, not a decoded domain object, so
 * a real implementation (proofs over a host DB) can replace a stub without the device layer
 * learning anything about entries, trees or proofs.
 */
export type WardProvider = {
    /** Answer a device-initiated pull. Throwing fails the device call -- it must not hang. */
    serveEntry(request: PROTO.WardEntryRequest): PROTO.WardEntryAck | Promise<PROTO.WardEntryAck>;
    /** Release resources the provider holds (e.g. an open database handle) on teardown. */
    dispose?(): void | Promise<void>;
};
