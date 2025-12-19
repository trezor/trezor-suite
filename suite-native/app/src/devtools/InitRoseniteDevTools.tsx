import { useEffect, useState } from 'react';
import { MMKV } from 'react-native-mmkv';

import { useServices } from '@suite-common/redux-utils';

import { useRozenitePlugins } from '../hooks/useRozenitePlugins';

const InitRosenitePluginInternal = ({ mmkvStorage }: { mmkvStorage: MMKV }) => {
    // react hooks can be conditionally called with __DEV__ statement (Metro takes care of it)
    useRozenitePlugins({
        mmkvStorage,
    });

    return null;
};

export const InitRosenitePlugin = () => {
    const { getMMKVStorage } = useServices();
    const [mmkvStorage, setMMKVStorage] = useState<MMKV | null>(null);

    useEffect(() => {
        getMMKVStorage().then(mmkv => {
            setMMKVStorage(mmkv);
        });
    }, [getMMKVStorage]);

    return Boolean(mmkvStorage) && mmkvStorage ? (
        <InitRosenitePluginInternal mmkvStorage={mmkvStorage} />
    ) : null;
};
