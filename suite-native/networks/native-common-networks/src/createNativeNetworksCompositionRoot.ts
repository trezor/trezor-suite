import { type Reducer, combineReducers } from '@reduxjs/toolkit';

import type { NativeNetworkReducerKey } from '@suite-native/network-module-suite-native-types';
import { type MMKVStorageDep } from '@suite-native/storage';
import { typedObjectFromEntries } from '@trezor/utils';

import { createNativeNetworkModuleRepository } from './NativeNetworkModuleRepository';
import type { NativeNetworksServices } from './NativeNetworksServices';
import {
    type NativeNetworkModules,
    createNativeModulesCompositionRoot,
} from './createNativeModulesCompositionRoot';

export const combineNetworkReducers = (networkModules: NativeNetworkModules): Reducer => {
    const reducers = new Map<NativeNetworkReducerKey, Reducer>();

    networkModules.forEach(networkModule => {
        if (!networkModule.reducer) return;

        const { key, reducer } = networkModule.reducer;

        if (reducers.has(key)) {
            throw new Error(`Native network reducer key "${key}" is already registered.`);
        }

        reducers.set(key, reducer);
    });

    return combineReducers(typedObjectFromEntries([...reducers]));
};

export type NativeNetworksReducerDep = {
    nativeNetworksReducer: Reducer;
};

export type NativeNetworksCompositionRoot = {
    reducer: Reducer;
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
            getSendForm: networkSymbol =>
                networkModuleRepository.get(networkSymbol)?.getSendForm?.(),
            getAccountDetailBanners: networkSymbol =>
                networkModuleRepository.get(networkSymbol)?.accountDetailBanners ?? [],
        },
    };
};
