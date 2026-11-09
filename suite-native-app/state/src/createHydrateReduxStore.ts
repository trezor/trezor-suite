import { type StorePersistorDep } from './createStorePersistor';

type HydrateReduxStoreDeps = StorePersistorDep;

export type HydrateReduxStore = () => Promise<void>;

export type HydrateReduxStoreDep = { hydrateReduxStore: HydrateReduxStore };

export const createHydrateReduxStore = (deps: HydrateReduxStoreDeps): HydrateReduxStore => {
    let hydration: Promise<void> | null = null;

    return () => {
        hydration ??= new Promise<void>(resolve => {
            if (deps.storePersistor.getState().bootstrapped) {
                resolve();

                return;
            }

            const unsubscribe = deps.storePersistor.subscribe(() => {
                if (deps.storePersistor.getState().bootstrapped) {
                    unsubscribe();
                    resolve();
                }
            });

            // The persistor is created with manualPersist so no storage work runs during composition.
            deps.storePersistor.persist();
        });

        return hydration;
    };
};
