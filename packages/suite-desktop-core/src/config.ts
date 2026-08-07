import { isDevEnv } from '@suite-common/suite-utils';
import { TOR_URLS } from '@trezor/urls';

export const trezorIoOnionDomain = TOR_URLS['trezor.io'];
export const sldevOnionDomain = TOR_URLS['sldev.cz'];

export const oauthUrls = [
    'https://accounts.google.com',
    'https://www.dropbox.com/oauth2/authorize',
];

export const allowedProtocols = ['http:', 'https:'];

const allowedDomainsDev = [
    // google store for chrome extensions (devtools) loaded in electron-react-devtools.ts, see https://github.com/MarshallOfSound/electron-devtools-installer/blob/f8ec609/src/downloadChromeExtension.ts#L30
    'google.com',
    'googleusercontent.com',
];

export const localhostDomains = ['localhost', '127.0.0.1'];

export const allowedDomains = [
    ...localhostDomains,
    'trezor.io',
    'sldev.cz', // Test environment, available only with VPN
    'invity.io',
    'api.github.com',
    // Suite Dark flavour: the desktop auto-updater fetches its feed + installers from the
    // flavour's own GitHub "continuous" release. github.com serves the feed/asset URLs, which
    // 302-redirect to the release-assets.githubusercontent.com CDN — both must be allowlisted
    // or request-filter cancels the update check (net::ERR_BLOCKED_BY_CLIENT).
    'github.com',
    'githubusercontent.com',
    'api.dropboxapi.com',
    'content.dropboxapi.com',
    'notify.dropboxapi.com',
    'o117836.ingest.sentry.io', // TODO is this needed? Seems that the Sentry SDK bypasses interceptor
    'oauth2.googleapis.com',
    'googleapis.com',
    trezorIoOnionDomain,
    sldevOnionDomain,
    'earn.trezor.io',
    'verify.walletconnect.org', // WalletConnect
    'horizon.stellar.org', // Stellar Horizon, hosted by SDF
    'horizon-testnet.stellar.org', // Stellar Horizon (testnet), hosted by SDF
    'xrplcluster.com', // XRP Ledger cluster, hosted by XRP Ledger Foundation
    'xrpl.ws', // XRP Ledger cluster, hosted by XRP Ledger Foundation
    's2.ripple.com', // XRP Ledger cluster, hosted by Ripple
    ...(isDevEnv ? allowedDomainsDev : []),
];

export const silentlyBlockedDomains = [
    'pulse.walletconnect.org', // WalletConnect analytics
];

// Restrict Desktop Update to these URLs. Update installation is already gated by signature verification,
// so this is only an additional layer – no need to allow any other domains.
export const allowedDesktopUpdateDomains = [
    'trezor.io', // Production server
    'sldev.cz', // Test environment, available only with VPN
    ...localhostDomains, // Allowed for local testing
];
