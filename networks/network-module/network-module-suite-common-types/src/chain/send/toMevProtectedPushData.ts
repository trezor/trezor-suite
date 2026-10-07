export type MevProtectedPushData = string | { hex: string; disableAlternativeRPC: true };

/**
 * The `tx` Connect pushes. Without MEV protection the backend must not route the transaction
 * through its alternative (private) RPC.
 */
export const toMevProtectedPushData = (
    hex: string,
    isMevProtectionEnabled: boolean,
): MevProtectedPushData => (isMevProtectionEnabled ? hex : { hex, disableAlternativeRPC: true });
