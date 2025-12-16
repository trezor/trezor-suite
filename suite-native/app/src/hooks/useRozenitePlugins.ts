/* eslint-disable import/no-extraneous-dependencies */
//This rule has to be disabled, because we are importing rozenite plugins that are present only in package devDependencies.

import 'react-native-get-random-values';
import { MMKV } from 'react-native-mmkv';

import { useMMKVDevTools } from '@rozenite/mmkv-plugin';
import { useNetworkActivityDevTools } from '@rozenite/network-activity-plugin';
import { usePerformanceMonitorDevTools } from '@rozenite/performance-monitor-plugin';

export const useRozenitePlugins = ({ mmkvStorage }: { mmkvStorage: MMKV }) => {
    usePerformanceMonitorDevTools();
    useMMKVDevTools({
        storages: {
            'encrypted-storage': mmkvStorage,
        },
    });
    useNetworkActivityDevTools();
};
