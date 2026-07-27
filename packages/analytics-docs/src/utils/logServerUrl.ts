import { removeTrailingSlashes } from '@trezor/utils';

const STORAGE_KEY = 'analytics-docs-log-server-base-url';
const URL_PARAM = 'logServer';

const normalizeBaseUrl = (input: string): string => removeTrailingSlashes(input.trim());

export const getDefaultLogServerBaseUrl = (): string =>
    typeof window !== 'undefined'
        ? (() => {
              const { hostname, protocol, port } = window.location;
              // When docs run locally on 5180, default log server to 5181.
              if (hostname === 'localhost' && port === '5180') {
                  return `${protocol}//${hostname}:5181`;
              }

              return window.location.origin;
          })()
        : '';

export const getInitialLogServerBaseUrl = (): string => {
    if (typeof window === 'undefined') return '';

    const params = new URLSearchParams(window.location.search);
    const fromUrl = params.get(URL_PARAM);
    if (fromUrl) return normalizeBaseUrl(fromUrl);

    const fromStorage = window.localStorage.getItem(STORAGE_KEY);
    if (fromStorage) return normalizeBaseUrl(fromStorage);

    return getDefaultLogServerBaseUrl();
};

export const setLogServerBaseUrl = (baseUrl: string): void => {
    if (typeof window === 'undefined') return;

    const normalized = normalizeBaseUrl(baseUrl);
    const defaultUrl = getDefaultLogServerBaseUrl();

    if (!normalized || normalized === defaultUrl) {
        window.localStorage.removeItem(STORAGE_KEY);
    } else {
        window.localStorage.setItem(STORAGE_KEY, normalized);
    }

    const params = new URLSearchParams(window.location.search);
    if (!normalized || normalized === defaultUrl) {
        params.delete(URL_PARAM);
    } else {
        params.set(URL_PARAM, normalized);
    }

    const search = params.toString();
    const url = search ? `${window.location.pathname}?${search}` : window.location.pathname;
    window.history.replaceState(null, '', `${url}${window.location.hash}`);
};
