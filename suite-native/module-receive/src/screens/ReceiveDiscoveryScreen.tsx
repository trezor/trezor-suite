import { useCallback, useMemo } from 'react';
import { useSelector } from 'react-redux';

import { selectDiscoveryForSelectedDevice } from '@suite-common/wallet-core';
import { CenteredTitleHeader, Spinner, VStack } from '@suite-native/atoms';
import { Translation } from '@suite-native/intl';
import {
    type ReceiveStackParamList,
    type ReceiveStackRoutes,
    Screen,
    type StackProps,
    useInterceptNativeNavigation,
} from '@suite-native/navigation';

import { useReceiveNavigation } from '../hooks/useReceiveNavigation';

export const ReceiveDiscoveryScreen = ({
    navigation,
    route,
}: StackProps<ReceiveStackParamList, ReceiveStackRoutes.ReceiveDiscovery>) => {
    const { asset } = route.params;

    const { navigateToReceiveScreen } = useReceiveNavigation({ isReplaceRequired: true });
    const { status } = useSelector(selectDiscoveryForSelectedDevice) ?? {};

    const loadingState = useMemo(() => {
        if (status === 'cancelled' || status === 'failed') {
            return 'error';
        }
        if (status === 'complete') {
            return 'success';
        }

        return 'idle';
    }, [status]);

    const onComplete = useCallback(() => {
        if (loadingState === 'success') {
            navigateToReceiveScreen(asset);
        } else {
            navigation.goBack();
        }
    }, [loadingState, asset, navigateToReceiveScreen, navigation]);

    useInterceptNativeNavigation();

    return (
        <Screen isScrollable={false}>
            <VStack flex={1} justifyContent="center" alignItems="center" spacing="sp16">
                <Spinner loadingState={loadingState} onComplete={onComplete} />
                <CenteredTitleHeader
                    title={<Translation id="moduleReceive.discovery.title" />}
                    subtitle={
                        <Translation
                            id="moduleReceive.discovery.subtitle"
                            values={{ networkName: asset.networkName }}
                        />
                    }
                />
            </VStack>
        </Screen>
    );
};
