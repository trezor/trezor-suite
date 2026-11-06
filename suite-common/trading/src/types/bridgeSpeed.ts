export const BRIDGE_SPEED = {
    STANDARD: 'standard',
    FAST: 'fast',
} as const;

export type BridgeSpeed = (typeof BRIDGE_SPEED)[keyof typeof BRIDGE_SPEED];

export const DEFAULT_BRIDGE_SPEED: BridgeSpeed = BRIDGE_SPEED.STANDARD;

export const CCTP_BRIDGE_PROVIDER_IDS = ['circle-cctp'] as const;

export const isCctpBridgeProvider = (providerId: string | undefined): boolean =>
    !!providerId && (CCTP_BRIDGE_PROVIDER_IDS as readonly string[]).includes(providerId);
