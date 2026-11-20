import { type ReactNode, useContext } from 'react';

import { IsNavigationReadyContext } from '@suite-native/navigation';

import { useGlobalHooks } from '../hooks/useGlobalHooks';

const GlobalHooksWrapper = () => {
    useGlobalHooks();

    return null;
};

export const NavigatorLayoutWithGlobalHooks = ({ children }: { children: ReactNode }) => {
    const isNavigationReady = useContext(IsNavigationReadyContext);

    return (
        <>
            {/* If the navigation is not ready, we don't want to mount the global hooks yet, since they are relying on the navigation. */}
            {isNavigationReady && <GlobalHooksWrapper />}
            {children}
        </>
    );
};
