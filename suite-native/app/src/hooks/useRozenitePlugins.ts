/* eslint-disable import/no-extraneous-dependencies */
//This rule has to be disabled, because we are importing rozenite plugins that are present only in package devDependencies.

import 'react-native-get-random-values';
import { useMMKVDevTools } from '@rozenite/mmkv-plugin';
import { useNetworkActivityDevTools } from '@rozenite/network-activity-plugin';
import { usePerformanceMonitorDevTools } from '@rozenite/performance-monitor-plugin';

import { createEnsureMMKVKey, createMMKVStorage } from '@suite-native/storage';

export const useRozenitePlugins = () => {
    const ensureMMKVKey = createEnsureMMKVKey();
    const storage = createMMKVStorage({
        ensureMMKVKey,
    });

    usePerformanceMonitorDevTools();
    useMMKVDevTools({
        storages: {
            'encrypted-storage': storage,
        },
    });
    useNetworkActivityDevTools();
};
