/**
 * Shared validation for analytics event names (domain/event, exactly one slash).
 * Used by ESLint rule `analytics-event-name` and by analytics-docs AddEventModal.
 */

export const ANALYTICS_ALLOWED_DOMAINS = [
    'accounts',
    'app',
    'assets',
    'coin',
    'dashboard',
    'device',
    'earn',
    'feedback',
    'firmware',
    'guide',
    'menu',
    'navigate',
    'onboarding',
    'passphrase',
    'promo',
    'receive',
    'send',
    'settings',
    'staking',
    'yield',
    'trading',
    'transaction',
    'wallet',
    'wallet-connect',
] as const;

const ANALYTICS_EVENT_NAME_KEBAB_SEGMENT = /^[a-z0-9]+(-[a-z0-9]+)*$/;

const ALLOWED_DOMAINS_SET = new Set<string>(ANALYTICS_ALLOWED_DOMAINS);

export type ValidateEventNameError =
    | { messageId: 'invalidFormat' }
    | { messageId: 'invalidDomain'; data: { domain: string } }
    | { messageId: 'notKebabCase'; data: { eventPart: string } };

/**
 * Validates analytics event name: exactly "domain/event", with an allowed domain and a kebab-case event name.
 */
export function validateAnalyticsEventName(value: string): ValidateEventNameError | null {
    const [domain, eventPart, ...extraParts] = value.split('/');
    if (domain === undefined || eventPart === undefined || extraParts.length > 0) {
        return { messageId: 'invalidFormat' };
    }

    if (!ALLOWED_DOMAINS_SET.has(domain)) {
        return { messageId: 'invalidDomain', data: { domain } };
    }

    if (!ANALYTICS_EVENT_NAME_KEBAB_SEGMENT.test(eventPart)) {
        return { messageId: 'notKebabCase', data: { eventPart: value } };
    }

    return null;
}
