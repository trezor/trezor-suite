export const ALERT_BOX_INTENTS = ['brand', 'neutral', 'critical', 'warning', 'info'] as const;
export type AlertBoxIntent = (typeof ALERT_BOX_INTENTS)[number];
