import { forwardRef } from 'react';
import { useSelector } from 'react-redux';

import { useNavigation } from '@react-navigation/native';

import { selectHasDeviceDiscovery, selectIsDeviceAuthorized } from '@suite-common/wallet-core';
import { Button, VStack } from '@suite-native/atoms';
import { Assets } from '@suite-native/assets';
import {
    RootStackParamList,
    RootStackRoutes,
    StackNavigationProps,
} from '@suite-native/navigation';
import { Translation } from '@suite-native/intl';

import { PortfolioGraph, PortfolioGraphRef } from './PortfolioGraph';

export const PortfolioContent = forwardRef<PortfolioGraphRef>((_props, ref) => {
    const navigation = useNavigation<StackNavigationProps<RootStackParamList, RootStackRoutes>>();

    const isDeviceAuthorized = useSelector(selectIsDeviceAuthorized);
    const hasDiscovery = useSelector(selectHasDeviceDiscovery);
    const showReceiveButton = isDeviceAuthorized && !hasDiscovery;

    const handleReceive = () => {
        navigation.navigate(RootStackRoutes.ReceiveModal, { closeActionType: 'back' });
    };

    return (
        <VStack spacing="sp32" marginTop="sp8">
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
        </VStack>
    );
});
