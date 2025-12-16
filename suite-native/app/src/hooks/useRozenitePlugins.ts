/* eslint-disable import/no-extraneous-dependencies */
//This rule has to be disabled, because we are importing rozenite plugins that are present only in package devDependencies.

import 'react-native-get-random-values';
import { useMMKVDevTools } from '@rozenite/mmkv-plugin';
import { useNetworkActivityDevTools } from '@rozenite/network-activity-plugin';
import { usePerformanceMonitorDevTools } from '@rozenite/performance-monitor-plugin';

import { encryptedStorage } from '@suite-native/storage';

export const useRozenitePlugins = () => {
    usePerformanceMonitorDevTools();
    useMMKVDevTools({
        storages: {
            'encrypted-storage': encryptedStorage,
        },
    });
    useNetworkActivityDevTools();
};
