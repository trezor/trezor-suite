import { useSelector } from 'react-redux';
import { forwardRef } from 'react';

import { useNavigation } from '@react-navigation/native';

import { Box, Button, VStack } from '@suite-native/atoms';
import { Assets } from '@suite-native/assets';
import {
    RootStackParamList,
    RootStackRoutes,
    StackNavigationProps,
} from '@suite-native/navigation';
import { selectIsPortfolioTrackerDevice } from '@suite-common/wallet-core';
import { Translation } from '@suite-native/intl';

import { PortfolioGraph, PortfolioGraphRef } from './PortfolioGraph';

export const PortfolioContent = forwardRef<PortfolioGraphRef>((_props, ref) => {
    const navigation = useNavigation<StackNavigationProps<RootStackParamList, RootStackRoutes>>();

    const isPortfolioTrackerDevice = useSelector(selectIsPortfolioTrackerDevice);

    const handleReceive = () => {
        navigation.navigate(RootStackRoutes.ReceiveModal, { closeActionType: 'back' });
    };

    return (
        <VStack spacing="sp24" marginTop="sp8">
            <PortfolioGraph ref={ref} />
            <VStack spacing="sp24" marginHorizontal="sp16">
                <Box>
                    <Assets />
                </Box>
                {isPortfolioTrackerDevice && (
                    <Button
                        data-testID="@home/portolio/recieve-button"
                        size="large"
                        onPress={handleReceive}
                        viewLeft="arrowLineDown"
                    >
                        <Translation id="moduleHome.buttons.receive" />
                    </Button>
                )}
            </VStack>
        </VStack>
    );
});
