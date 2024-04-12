import { useSelector } from 'react-redux';
import { forwardRef, useImperativeHandle, useRef } from 'react';

import { useNavigation } from '@react-navigation/native';

import { Box, Button, Divider, VStack } from '@suite-native/atoms';
import { Assets } from '@suite-native/assets';
import { FeatureFlag, useFeatureFlag } from '@suite-native/feature-flags';
import {
    AccountsImportStackRoutes,
    RootStackParamList,
    RootStackRoutes,
    StackNavigationProps,
} from '@suite-native/navigation';
import { selectIsPortfolioTrackerDevice } from '@suite-common/wallet-core';
import { Translation } from '@suite-native/intl';

import { PortfolioGraph, PortfolioGraphRef } from './PortfolioGraph';

export type PortfolioContentRef = {
    refetchGraph?: () => Promise<void>;
};

export const PortfolioContent = forwardRef<PortfolioContentRef>((_props, ref) => {
    const graphRef = useRef<PortfolioGraphRef>(null);

    const navigation = useNavigation<StackNavigationProps<RootStackParamList, RootStackRoutes>>();

    const isPortfolioTrackerDevice = useSelector(selectIsPortfolioTrackerDevice);

    const [isUsbDeviceConnectFeatureEnabled] = useFeatureFlag(FeatureFlag.IsDeviceConnectEnabled);
    const [isSendEnabled] = useFeatureFlag(FeatureFlag.IsSendEnabled);

    const handleImportAssets = () => {
        navigation.navigate(RootStackRoutes.AccountsImport, {
            screen: AccountsImportStackRoutes.SelectNetwork,
        });
    };

    const handleReceive = () => {
        navigation.navigate(RootStackRoutes.ReceiveModal, { closeActionType: 'back' });
    };

    useImperativeHandle(
        ref,
        () => ({
            refetchGraph: graphRef.current?.refetch,
        }),
        [],
    );

    return (
        <VStack spacing="large" marginTop="small">
            <PortfolioGraph ref={graphRef} />
            <VStack spacing="large" marginHorizontal="small">
                <Box>
                    <Assets />
                </Box>
                {isPortfolioTrackerDevice && (
                    <Box>
                        <Button
                            data-testID="@home/portfolio/sync-coins-button"
                            colorScheme="tertiaryElevation0"
                            size="large"
                            onPress={handleImportAssets}
                        >
                            <Translation id="moduleHome.buttons.syncMyCoins" />
                        </Button>
                    </Box>
                )}
                {!isUsbDeviceConnectFeatureEnabled && (
                    <>
                        <Divider />
                        <Box>
                            <Button
                                data-testID="@home/portolio/recieve-button"
                                size="large"
                                onPress={handleReceive}
                                iconLeft="receive"
                            >
                                <Translation id="moduleHome.buttons.receive" />
                            </Button>
                        </Box>
                    </>
                )}
            </VStack>
        </VStack>
    );
});
