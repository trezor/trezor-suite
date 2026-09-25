import { type Reducer, combineReducers } from '@reduxjs/toolkit';

import { type MMKVStorageDep } from '@suite-native/storage';

import { createNativeNetworkModuleRepository } from './NativeNetworkModuleRepository';
import type { NativeNetworksServices } from './NativeNetworksServices';
import {
    type NativeNetworkModules,
    createNativeModulesCompositionRoot,
} from './createNativeModulesCompositionRoot';

export const combineNetworkReducers = (networkModules: NativeNetworkModules) => {
    const reducers = new Map<string, Reducer>();

    networkModules.forEach(networkModule => {
        const { key, reducer } = networkModule.reducer;

        if (reducers.has(key)) {
            throw new Error(`Native network reducer key "${key}" is already registered.`);
        }

        reducers.set(key, reducer);
    });

    return combineReducers(Object.fromEntries(reducers));
};

export type NativeNetworksReducer = ReturnType<typeof combineNetworkReducers>;

export type NativeNetworksReducerDep = {
    nativeNetworksReducer: NativeNetworksReducer;
};

export type NativeNetworksCompositionRoot = {
    reducer: NativeNetworksReducer;
    services: NativeNetworksServices;
};

export type NativeNetworksCompositionRootDeps = MMKVStorageDep;

export const createNativeNetworksCompositionRoot = (
    deps: NativeNetworksCompositionRootDeps,
): NativeNetworksCompositionRoot => {
    const networkModules = createNativeModulesCompositionRoot(deps);
    const networkModuleRepository = createNativeNetworkModuleRepository(networkModules);

    return {
        reducer: combineNetworkReducers(networkModules),
        services: {
            getAccountDetailBanners: networkSymbol =>
                networkModuleRepository.get(networkSymbol)?.accountDetailBanners ?? [],
        },
    };
};
