import { type MMKV } from 'react-native-mmkv';

import { useMMKVDevTools } from '@rozenite/mmkv-plugin';
import { useNetworkActivityDevTools } from '@rozenite/network-activity-plugin';
import { usePerformanceMonitorDevTools } from '@rozenite/performance-monitor-plugin';
import { useTanStackQueryDevTools } from '@rozenite/tanstack-query-plugin';

import { useQueryClient } from '@suite-common/react-query';
import { clearHistoricRates } from '@suite-native/transactions';

// Expose to the Hermes console for testing persistence: __clearHistoricRates()
(global as Record<string, unknown>).__clearHistoricRates = clearHistoricRates;

export const useRozenitePlugins = ({ mmkvStorage }: { mmkvStorage: MMKV }) => {
    const queryClient = useQueryClient();

    usePerformanceMonitorDevTools();
    useMMKVDevTools({
        storages: {
            'encrypted-storage': mmkvStorage,
        },
    });
    useNetworkActivityDevTools();
    useTanStackQueryDevTools(queryClient);
};
