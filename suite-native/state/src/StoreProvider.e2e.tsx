import { launchArguments } from '@suite-native/config';

import { BaseStoreProvider, type BaseStoreProviderProps } from './BaseStoreProvider';
import { type PreloadedState } from './store';

type StoreProviderProps = BaseStoreProviderProps;

export const StoreProvider = ({ children }: StoreProviderProps) => {
    const { preloadedState } = launchArguments;

    return (
        // preloadedState has to be cast to PreloadedState type because it is passed from Detox as `string` (serialized object)
        // but the `react-native-launch-arguments` library does converts it to JavaScript object in the background.
        <BaseStoreProvider preloadedState={preloadedState as PreloadedState}>
            {children}
        </BaseStoreProvider>
    );
};
