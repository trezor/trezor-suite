import { isDevEnv } from '@suite-common/suite-utils';
import { TOR_URLS } from '@trezor/urls';

export const onionDomain = TOR_URLS['trezor.io'];

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
    'lightspark.com', // Spark
    'spark.flashnet.xyz', // Spark
    'spark-operator.breez.technology', // Spark mainnet signing operator
    'api.github.com',
    'api.dropboxapi.com',
    'content.dropboxapi.com',
    'notify.dropboxapi.com',
    'o117836.ingest.sentry.io', // TODO is this needed? Seems that the Sentry SDK bypasses interceptor
    'oauth2.googleapis.com',
    'googleapis.com',
    onionDomain,
    'earn.trezor.io',
    'verify.walletconnect.org', // WalletConnect
    'horizon.stellar.org', // Stellar Horizon, hosted by SDF
    'horizon-testnet.stellar.org', // Stellar Horizon (testnet), hosted by SDF
    'xrplcluster.com', // XRP Ledger cluster, hosted by XRP Ledger Foundation
    'xrpl.ws', // XRP Ledger cluster, hosted by XRP Ledger Foundation
    's2.ripple.com', // XRP Ledger cluster, hosted by Ripple
    ...(isDevEnv === true ? allowedDomainsDev : []),
];

export const silentlyBlockedDomains = [
    'pulse.walletconnect.org', // WalletConnect analytics
];
