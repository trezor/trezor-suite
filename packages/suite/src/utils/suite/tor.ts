import { TOR_DOMAIN } from '@suite-constants/urls';

export const toTorUrl = (url: string) =>
    url.replace(/https:\/\/([a-z0-9]+\.)trezor.io(.*)/, `http://$1${TOR_DOMAIN}$2`);

export const isTorDomain = (domain: string) => domain.endsWith(TOR_DOMAIN);
