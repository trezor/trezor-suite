import { TOR_URLS } from '@trezor/urls';

export const onionDomain = TOR_URLS['trezor.io'];

export const oauthUrls = [
    'https://accounts.google.com',
    'https://www.dropbox.com/oauth2/authorize',
];

export const allowedProtocols = ['http:', 'https:'];

export const allowedDomains = [
    'localhost',
    '127.0.0.1',
    'trezor.io',
    'invity.io',
    'api.github.com',
    'api.dropboxapi.com',
    'content.dropboxapi.com',
    'notify.dropboxapi.com',
    'o117836.ingest.sentry.io',
    'oauth2.googleapis.com',
    'googleapis.com',
    onionDomain,
    'trezor-cardano-mainnet.blockfrost.io',
    'trezor-cardano-preview.blockfrost.io',
    'blockfrost.dev',
    'eth-api-b2c-stage.everstake.one', // staking endpoint for Holesky testnet, works only with VPN
    'eth-api-b2c.everstake.one', // staking endpoint for Ethereum mainnet
];

export const cspRules = [
    // Default to only own resources
    "default-src 'self'",
    // Allow all API calls (Can't be restricted bc of custom backends)
    'connect-src *',
    // Allow images from trezor.io
    "img-src 'self' *.trezor.io",
];
