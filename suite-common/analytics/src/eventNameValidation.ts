/**
 * Shared validation for analytics event names (domain/event format).
 * Used by ESLint rule `analytics-event-name` and by analytics-docs AddEventModal.
 */

export const ANALYTICS_ALLOWED_DOMAINS = [
    'accounts',
    'app',
    'coin',
    'dashboard',
    'device',
    'firmware',
    'guide',
    'menu',
    'passphrase',
    'promo',
    'receive',
    'send',
    'settings',
    'staking',
    'yield',
    'trading',
    'transaction',
    'wallet-connect',
] as const;

export type AnalyticsDomain = (typeof ANALYTICS_ALLOWED_DOMAINS)[number];

export const ANALYTICS_EVENT_NAME_KEBAB_SEGMENT = /^[a-z0-9]+(-[a-z0-9]+)*$/;

const ALLOWED_DOMAINS_SET = new Set<string>(ANALYTICS_ALLOWED_DOMAINS);

export type ValidateEventNameError =
    | { messageId: 'invalidFormat' }
    | { messageId: 'invalidDomain'; data: { domain: string } }
    | { messageId: 'notKebabCase'; data: { eventPart: string } };

/**
 * Validates analytics event name: must be "domain/event" with allowed domain and kebab-case segments.
 */
export function validateAnalyticsEventName(value: string): ValidateEventNameError | null {
    if (!value.includes('/')) {
        return { messageId: 'invalidFormat' };
    }

    const parts = value.split('/');
    const domain = parts[0];
    const eventSegments = parts.slice(1);

    if (!ALLOWED_DOMAINS_SET.has(domain)) {
        return { messageId: 'invalidDomain', data: { domain } };
    }

    for (const segment of eventSegments) {
        if (!ANALYTICS_EVENT_NAME_KEBAB_SEGMENT.test(segment)) {
            return { messageId: 'notKebabCase', data: { eventPart: value } };
        }
    }

    return null;
}

/**
 * Returns true if the event part (part after domain/) is valid kebab-case.
 * For multi-segment event parts (e.g. "app-log/exported"), each segment is validated.
 */
export function isValidEventPart(eventPart: string): boolean {
    if (eventPart.trim() === '') return false;
    const segments = eventPart.split('/');

    return segments.every(seg => ANALYTICS_EVENT_NAME_KEBAB_SEGMENT.test(seg.trim()));
}
