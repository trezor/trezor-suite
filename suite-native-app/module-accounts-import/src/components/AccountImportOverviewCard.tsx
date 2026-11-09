import { type ReactNode } from 'react';

import { Box, Card, HStack, Text } from '@suite-native/atoms';
import { prepareNativeStyle, useNativeStyles } from '@trezor/styles-native';

const assetCardStyle = prepareNativeStyle(utils => ({
    padding: utils.spacings.sp24,
    borderRadius: utils.borders.radii.r20,
    width: '100%',
}));

type AccountImportOverviewCardProps = {
    children?: ReactNode;
    icon: ReactNode;
    cryptoAmount: ReactNode;
    coinName: string;
};

export const AccountImportOverviewCard = ({
    children,
    icon,
    coinName,
    cryptoAmount,
}: AccountImportOverviewCardProps) => {
    const { applyStyle } = useNativeStyles();

    return (
        <Card style={applyStyle(assetCardStyle)}>
            <HStack marginBottom="sp24" spacing="sp16" alignItems="center">
                {icon}
                <Box>
                    <Text>{coinName}</Text>
                    {cryptoAmount}
                </Box>
            </HStack>
            {children}
        </Card>
    );
};
