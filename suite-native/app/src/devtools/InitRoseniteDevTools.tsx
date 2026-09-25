import { memo, useEffect, useState } from 'react';
import { type MMKV } from 'react-native-mmkv';

import { useMMKVDevTools } from '@rozenite/mmkv-plugin';
import { useNetworkActivityDevTools } from '@rozenite/network-activity-plugin';
import { usePerformanceMonitorDevTools } from '@rozenite/performance-monitor-plugin';

import { useServices } from '@suite-common/dependency-injection';
import { injectMMKVStorage } from '@suite-native/services';

type InitRozeniteMMKVPluginInternalProps = {
    mmkvStorage: MMKV;
};

const InitRozeniteMMKVPluginInternal = memo(
    ({ mmkvStorage }: InitRozeniteMMKVPluginInternalProps) => {
        useMMKVDevTools({
            storages: {
                'encrypted-storage': mmkvStorage,
            },
        });

        return null;
    },
);

const InitRozeniteMMKVPlugin = memo(() => {
    const { getMMKVStorage } = useServices(injectMMKVStorage);
    const [mmkvStorage, setMMKVStorage] = useState<MMKV | null>(null);

    useEffect(() => {
        getMMKVStorage().then(mmkv => {
            setMMKVStorage(mmkv);
        });
    }, [getMMKVStorage]);

    return mmkvStorage ? <InitRozeniteMMKVPluginInternal mmkvStorage={mmkvStorage} /> : null;
});

export const InitRosenitePlugin = memo(() => {
    usePerformanceMonitorDevTools();
    useNetworkActivityDevTools();

    return process.env.EXPO_PUBLIC_IS_ROZENITE_MMKV_DEVTOOLS_ENABLED === 'true' ? (
        <InitRozeniteMMKVPlugin />
    ) : null;
});
