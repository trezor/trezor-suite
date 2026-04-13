import type { PreloadedState, StoreWithExtra } from '@suite-native/state';

type InitStore = (preloadedState?: PreloadedState) => StoreWithExtra;

let lazyLoadedInitStore: InitStore | null = null;

export const initStore = (preloadedState?: PreloadedState) => {
    if (!lazyLoadedInitStore) {
        const { initStore: localInitStore } = require('@suite-native/state');
        lazyLoadedInitStore = localInitStore as InitStore;
    }

    return lazyLoadedInitStore(preloadedState);
};
