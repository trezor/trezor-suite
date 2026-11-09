import { useEffect, useState } from 'react';

import { useNavigation } from '@react-navigation/native';

export const useIsConnectPopupOpened = () => {
    const navigation = useNavigation();
    const rootNavigation = navigation.getParent() ?? navigation;

    const [rootNavState, setRootNavState] = useState(() => rootNavigation.getState());

    useEffect(() => {
        const unsubscribe = rootNavigation.addListener('state', e => {
            setRootNavState(e.data.state);
        });

        return unsubscribe;
    }, [rootNavigation]);

    const isPopupInStack = rootNavState?.routes.find(route => route.name === 'ConnectPopup');

    return !!isPopupInStack;
};
