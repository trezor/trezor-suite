import type { MessagesSchema as Messages } from '@trezor/protobuf';
import type { MessageResponse } from '@trezor/transport';

type AbortableOptions = {
    timeout?: number;
    signal?: AbortSignal;
};

// Return type for call() / receive() / cancelCall() — success payload is a typed protobuf message.
type CallResult = { success: true; payload: MessageResponse } | { success: false; error: Error };

// Return type for send() — transport.send() yields no payload on success (only a write, no read).
type SendResult = { success: true; payload: undefined } | { success: false; error: Error };

/**
 * Minimal interface to communicate with a connected device through its current transport session.
 *
 * Placed in types/ (rather than device/DeviceCurrentSession.ts) so that it can be imported by
 * types/device.ts inside IDevice without creating circular imports.
 */
export interface TypedCallProvider {
    typedCall: Messages.TypedCall;
    isDisposed: () => boolean;
    cancelCall: () => Promise<CallResult>;
    call: (
        name: string,
        data: Record<string, unknown>,
        options?: AbortableOptions,
    ) => Promise<CallResult>;
    send: (
        name: string,
        data: Record<string, unknown>,
        options?: AbortableOptions,
    ) => Promise<SendResult>;
    receive: (options?: AbortableOptions) => Promise<CallResult>;
}
