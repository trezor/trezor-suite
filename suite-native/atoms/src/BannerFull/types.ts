export const ALERT_BOX_INTENTS = [
    'brand',
    'neutral',
    'critical',
    'warning',
    'info',
    'debug',
] as const;
export type AlertBoxIntent = (typeof ALERT_BOX_INTENTS)[number];
