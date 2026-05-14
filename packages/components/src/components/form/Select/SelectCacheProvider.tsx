import { type ReactNode } from 'react';

// Todo: hack to workaround the issue, see:
//      - https://github.com/JedWatson/react-select/issues/4631
// eslint-disable-next-line import/no-extraneous-dependencies
import createCache from '@emotion/cache';
// eslint-disable-next-line import/no-extraneous-dependencies
import { CacheProvider, type EmotionCache } from '@emotion/react';

export type SelectCacheProviderProps = {
    children: ReactNode;
};

// Todo: hack to workaround the issue, see: https://github.com/JedWatson/react-select/issues/4631
const cache: EmotionCache = createCache({
    key: 'react-select-nonce-hack',
    // window may be undefined during SSR, for example in Connect Explorer
    nonce: typeof window !== 'undefined' && window?.cspNonce ? window.cspNonce : '',
});

export const SelectCacheProvider = ({ children }: SelectCacheProviderProps) => (
    <CacheProvider value={cache}>{children}</CacheProvider>
);
