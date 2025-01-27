import { forwardRef } from 'react';
import { LinearTransition } from 'react-native-reanimated';
import { useSelector } from 'react-redux';

import { useNavigation } from '@react-navigation/native';

import { selectHasDeviceDiscovery, selectIsDeviceAuthorized } from '@suite-common/wallet-core';
import { Assets } from '@suite-native/assets';
import { AnimatedVStack, Button, VStack } from '@suite-native/atoms';
import { Translation } from '@suite-native/intl';
import {
    ReceiveStackRoutes,
    RootStackParamList,
    RootStackRoutes,
    StackNavigationProps,
} from '@suite-native/navigation';

import { PortfolioGraph, PortfolioGraphRef } from './PortfolioGraph';

export const PortfolioContent = forwardRef<PortfolioGraphRef>((_props, ref) => {
    const navigation = useNavigation<StackNavigationProps<RootStackParamList, RootStackRoutes>>();

    const isDeviceAuthorized = useSelector(selectIsDeviceAuthorized);
    const hasDiscovery = useSelector(selectHasDeviceDiscovery);
    const showReceiveButton = isDeviceAuthorized && !hasDiscovery;

    const handleReceive = () => {
        navigation.navigate(RootStackRoutes.ReceiveStack, {
            screen: ReceiveStackRoutes.ReceiveAccounts,
        });
    };

    return (
        <VStack spacing="sp32" marginTop="sp8">
            <AnimatedVStack spacing="sp32" layout={LinearTransition}>
                <PortfolioGraph ref={ref} />
                <VStack spacing="sp24" marginHorizontal="sp16">
                    {showReceiveButton && (
                        <Button
                            data-testID="@home/portolio/recieve-button"
                            onPress={handleReceive}
                            viewLeft="arrowLineDown"
                        >
                            <Translation id="moduleHome.buttons.receive" />
                        </Button>
                    )}
                    <Assets />
                </VStack>
            </AnimatedVStack>
        </VStack>
    );
});
