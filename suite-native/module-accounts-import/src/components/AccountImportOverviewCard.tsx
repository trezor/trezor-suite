import { ReactNode } from 'react';

import { Box, Card, Text } from '@suite-native/atoms';
import { prepareNativeStyle, useNativeStyles } from '@trezor/styles';

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
            <Box flexDirection="row" marginBottom="sp24" justifyContent="space-between">
                <Box flexDirection="row">
                    {icon}
                    <Box marginLeft="sp16">
                        <Text>{coinName}</Text>
                        {cryptoAmount}
                    </Box>
                </Box>
            </Box>
            {children}
        </Card>
    );
};
