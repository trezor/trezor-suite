import { Discovery } from '@wallet-reducers/discoveryReducer';

/**
 * Strip unserializable fields from Discovery (eg. promises)
 *
 * @param {Discovery} discovery
 */
export const serializeDiscovery = (discovery: Discovery) => ({ ...discovery, running: undefined });
