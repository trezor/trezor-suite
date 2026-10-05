/**
 * Relays the contacts address exchange falls back to when the user has configured none. Empty on
 * purpose: the exchange publishes addresses and identity tags in plain text, so nothing leaves the
 * app until the user adds a relay in Settings.
 */
export const DEFAULT_RELAY_URLS: readonly string[] = [];

/**
 * The relays to connect to. A configured list replaces the defaults instead of extending them, so
 * a relay settings editor must edit this effective list, not the configured one.
 */
export const getEffectiveRelayUrls = (configuredUrls: readonly string[]): readonly string[] =>
    configuredUrls.length > 0 ? configuredUrls : DEFAULT_RELAY_URLS;
