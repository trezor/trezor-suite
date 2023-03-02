import React, { ReactNode } from 'react';

import { useNavigation } from '@react-navigation/core';

import { Box, Card, IconButton, Text } from '@suite-native/atoms';
import { prepareNativeStyle, useNativeStyles } from '@trezor/styles';
import {
    AccountsImportStackParamList,
    AccountsImportStackRoutes,
    RootStackParamList,
    RootStackRoutes,
    StackToTabCompositeProps,
} from '@suite-native/navigation';
import { NetworkSymbol } from '@suite-common/wallet-config';

const assetCardStyle = prepareNativeStyle(utils => ({
    padding: utils.spacings.large,
    borderRadius: utils.borders.radii.large,
    width: '100%',
}));

type NavigationProp = StackToTabCompositeProps<
    AccountsImportStackParamList,
    AccountsImportStackRoutes.AccountImportSummary,
    RootStackParamList
>;

type AccountImportOverviewCardProps = {
    children?: ReactNode;
    icon: ReactNode;
    cryptoAmount: ReactNode;
    coinName: string;
    symbol: NetworkSymbol;
};
export const AccountImportOverviewCard = ({
    children,
    icon,
    coinName,
    symbol,
    cryptoAmount,
}: AccountImportOverviewCardProps) => {
    const navigation = useNavigation<NavigationProp>();
    const { applyStyle } = useNativeStyles();

    const handleNavigateToQRScan = () =>
        navigation.navigate(RootStackRoutes.AccountsImport, {
            screen: AccountsImportStackRoutes.XpubScan,
            params: {
                networkSymbol: symbol,
            },
        });

    return (
        <Card style={applyStyle(assetCardStyle)}>
            <Box flexDirection="row" marginBottom="large" justifyContent="space-between">
                <Box flexDirection="row">
                    {icon}
                    <Box marginLeft="medium">
                        <Text>{coinName}</Text>
                        {cryptoAmount}
                    </Box>
                </Box>
                <IconButton
                    iconName="trash"
                    colorScheme="tertiaryElevation1"
                    onPress={handleNavigateToQRScan}
                    size="medium"
                />
            </Box>
            {children}
        </Card>
    );
};
