import { isDevEnv } from '@suite-common/suite-utils';

// Jazz sync server URL configuration
// For local development, use ws://localhost:4200
// For production, use wss://cloud.jazz.tools with an API key

export const DEFAULT_SUITE_SYNC_RELAY_URL = isDevEnv
    ? 'ws://localhost:4200'
    : 'wss://cloud.jazz.tools/?key=trezor-suite-production';
