import { type MMKV } from 'react-native-mmkv';

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
