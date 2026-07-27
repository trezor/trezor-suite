import { TOR_URLS } from '@trezor/urls';
import { urlToOnion } from '@trezor/utils';

// Alias for urlToOnion with pre-filled TOR_URLS.
export const getTorUrlIfAvailable = (url: string) => urlToOnion(url, TOR_URLS);
