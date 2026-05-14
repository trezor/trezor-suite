import { memo, useEffect, useState } from 'react';
import { type MMKV } from 'react-native-mmkv';

import { useNativeServices } from '@suite-native/services';

import { useRozenitePlugins } from '../hooks/useRozenitePlugins';

const InitRosenitePluginInternal = memo(({ mmkvStorage }: { mmkvStorage: MMKV }) => {
    // react hooks can be conditionally called with __DEV__ statement (Metro takes care of it)
    useRozenitePlugins({
        mmkvStorage,
    });

    return null;
});

export const InitRosenitePlugin = memo(() => {
    const { getMMKVStorage } = useNativeServices();
    const [mmkvStorage, setMMKVStorage] = useState<MMKV | null>(null);

    useEffect(() => {
        getMMKVStorage().then(mmkv => {
            setMMKVStorage(mmkv);
        });
    }, [getMMKVStorage]);

    return Boolean(mmkvStorage) && mmkvStorage ? (
        <InitRosenitePluginInternal mmkvStorage={mmkvStorage} />
    ) : null;
});
