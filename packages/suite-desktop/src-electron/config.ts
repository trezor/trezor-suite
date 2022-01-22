import * as fs from 'fs';
import * as path from 'path';
import { TOR_URLS } from '@suite-constants/tor';

export const onionDomain = TOR_URLS['trezor.io'];

export const oauthUrls = [
    'https://accounts.google.com',
    'https://www.dropbox.com/oauth2/authorize',
];

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
    'trezor-cardano-testnet.blockfrost.io',
    'blockfrost.dev',
];

// TODO: Maybe put these to the Electron store as read-only values?
const assetHashesFilePath = path.join(
    __dirname,
    '..',
    '..',
    'build',
    'static',
    'invity-authentication',
    'asset-hashes.json',
);
const assetHashesFileContent = fs.readFileSync(assetHashesFilePath);
const assetHashes = JSON.parse(assetHashesFileContent.toString()) as {
    scripts: string[];
    styles: string[];
    fonts: string[];
}; // TODO: Do we want to generate and import AssetHashes type?

// TODO: may be create function getContentSecurtyPolicyHeaderValue(store)? And from the store get the asset-hashes.json file path?
export const cspRules = [
    // Default to only own resources
    "default-src 'self'",
    // Allow all API calls (Can't be restricted bc of custom backends)
    'connect-src *',
    // Allow images from trezor.io
    "img-src 'self' *.trezor.io",
    `script-src-elem ${assetHashes.scripts.map(hash => `'${hash}'`).join(' ')}`,
    `style-src ${assetHashes.styles.map(hash => `'${hash}'`).join(' ')}`,
    `font-src 'self' data:`, // TODO: or hashes? with
];
