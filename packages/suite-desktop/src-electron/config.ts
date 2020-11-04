export const onionDomain = 'trezoriovpjcahpzkrewelclulmszwbqpzmzgub37gbcjlvluxtruqad.onion';

export const oauthUrls = [
    'https://accounts.google.com',
    'https://www.dropbox.com/oauth2/authorize',
];

export const allowedExternalUrls = [
    // SatoshiLabs
    'https://trezor.io/support',
    'https://wiki.trezor.io',
    'https://blog.trezor.io',
    // External Services
    'https://github.com/trezor/',
    'https://satoshilabs.typeform.com',
    // invity + partners
    'https://invity.io',
    'https://exchange.mercuryo.io/',
    'https://btcdirect.eu/',
    'https://my.btcdirect.eu/',
    'https://my-sandbox.btcdirect.eu/',
    'https://cexdirect.com/',
    // internal server - used for buy post request
    'http://127.0.0.1',
];

export const allowedDomains = [
    'localhost',
    '127.0.0.1',
    'trezor.io',
    'api.github.com',
    'api.dropboxapi.com',
    'content.dropboxapi.com',
    'notify.dropboxapi.com',
    'o117836.ingest.sentry.io',
    onionDomain,
];

export const cspRules = [
    // Default to only own resources
    "default-src 'self'",
    // Allow all API calls (Can't be restricted bc of custom backends)
    'connect-src *',
    // Allow images from trezor.io
    "img-src 'self' *.trezor.io",
];
