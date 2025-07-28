import { launchArguments } from '@suite-native/config';

import { BaseStoreProvider, BaseStoreProviderProps } from './BaseStoreProvider';

type StoreProviderProps = BaseStoreProviderProps;

export const StoreProvider = ({ children }: StoreProviderProps) => {
    const { preloadedState } = launchArguments;

    return <BaseStoreProvider preloadedState={preloadedState}>{children}</BaseStoreProvider>;
};
