import { useSelector } from 'react-redux';
import { forwardRef, useImperativeHandle, useRef } from 'react';

import { useNavigation } from '@react-navigation/native';

import { Box, Button, Divider, VStack } from '@suite-native/atoms';
import { Assets } from '@suite-native/assets';
import { useIsUsbDeviceConnectFeatureEnabled } from '@suite-native/feature-flags';
import {
    AccountsImportStackRoutes,
    RootStackParamList,
    RootStackRoutes,
    StackNavigationProps,
} from '@suite-native/navigation';
import { selectIsSelectedDeviceImported } from '@suite-common/wallet-core';
import { useTranslate } from '@suite-native/intl';

import { PortfolioGraph, PortfolioGraphRef } from './PortfolioGraph';

export type PortfolioContentRef = {
    refetchGraph?: () => Promise<void>;
};

export const PortfolioContent = forwardRef<PortfolioContentRef>((_props, ref) => {
    const { translate } = useTranslate();
    const graphRef = useRef<PortfolioGraphRef>(null);

    const navigation = useNavigation<StackNavigationProps<RootStackParamList, RootStackRoutes>>();

    const isDeviceImported = useSelector(selectIsSelectedDeviceImported);

    const { isUsbDeviceConnectFeatureEnabled } = useIsUsbDeviceConnectFeatureEnabled();

    const handleImportAssets = () => {
        navigation.navigate(RootStackRoutes.AccountsImport, {
            screen: AccountsImportStackRoutes.SelectNetwork,
        });
    };

    const handleReceive = () => {
        navigation.navigate(RootStackRoutes.ReceiveModal, {});
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
            <Assets />
            {isDeviceImported && (
                <Box marginHorizontal="medium">
                    <Button
                        data-testID="@home/portfolio/sync-coins-button"
                        colorScheme="tertiaryElevation0"
                        size="large"
                        onPress={handleImportAssets}
                    >
                        {translate('moduleHome.buttons.syncMyCoins')}
                    </Button>
                </Box>
            )}
            {!isUsbDeviceConnectFeatureEnabled && (
                <>
                    <Divider />
                    <Box marginHorizontal="medium">
                        <Button
                            data-testID="@home/portolio/recieve-button"
                            size="large"
                            onPress={handleReceive}
                            iconLeft="receive"
                        >
                            {translate('moduleHome.buttons.receive')}
                        </Button>
                    </Box>
                </>
            )}
        </VStack>
    );
});
