import { TOR_DOMAIN } from '@suite-constants/urls';

// todo: make it general for more tor domain
export const toTorUrl = (url: string) =>
    url.replace(/https:\/\/(([a-z0-9]+\.)*)trezor\.io(.*)/, `http://$1${TOR_DOMAIN}$3`);

export const isTorDomain = (domain: string) => domain.endsWith(TOR_DOMAIN);
