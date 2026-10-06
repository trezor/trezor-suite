import { type Persistor, type PersistorOptions, persistStore } from 'redux-persist';

import { type NativeReduxStoreDep } from './createReduxStore';

export type StorePersistorDeps = NativeReduxStoreDep;

export type StorePersistor = Persistor;

export type StorePersistorDep = { storePersistor: StorePersistor };

export const createStorePersistor = (deps: StorePersistorDeps): StorePersistor => {
    // Redux-persist supports manualPersist at runtime but omits it from PersistorOptions.
    const persistorOptions: PersistorOptions & { manualPersist: boolean } = { manualPersist: true };

    return persistStore(deps.store, persistorOptions);
};
