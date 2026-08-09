export * from './relayClient';

/** Public relay used by the Verified Contacts PoC. Must also be listed in
 *  packages/suite-desktop-core/src/config.ts allowedDomains, or desktop blocks it. */
export const DEFAULT_RELAY_URL = 'wss://relay.primal.net';
