import { type ReactNode } from 'react';

import { type AccountKey } from '@suite-common/wallet-types';
import { AccountTypeBadge } from '@suite-native/accounts';
import { Box, Card, PressableOpacity, Text, VStack } from '@suite-native/atoms';
import { Icon } from '@suite-native/icons';
import { prepareNativeStyle, useNativeStyles } from '@trezor/styles-native';

const itemCardStyle = prepareNativeStyle(utils => ({
    marginBottom: utils.spacings.sp16,
}));

const rowStyle = prepareNativeStyle(utils => ({
    paddingLeft: utils.spacings.sp16,
    paddingRight: utils.spacings.sp12,
    paddingVertical: utils.spacings.sp12,
    flexDirection: 'row',
    alignItems: 'center',
    minHeight: 70,
}));

const contentStyle = prepareNativeStyle(_ => ({
    flex: 1,
}));

const valuesStyle = prepareNativeStyle(utils => ({
    alignItems: 'flex-end',
    paddingLeft: utils.spacings.sp8,
}));

type EarnAccountCardLayoutProps = {
    accountKey: AccountKey;
    icon: ReactNode;
    title: string;
    value: ReactNode;
    onPress: () => void;
    description?: ReactNode;
    valueDescription?: ReactNode;
    alerts?: ReactNode;
};

export const EarnAccountCardLayout = ({
    accountKey,
    icon,
    title,
    value,
    onPress,
    description,
    valueDescription,
    alerts,
}: EarnAccountCardLayoutProps) => {
    const { applyStyle } = useNativeStyles();

    return (
        <Card borderColor="borderNeutral" noPadding style={applyStyle(itemCardStyle)}>
            <PressableOpacity onPress={onPress} style={applyStyle(rowStyle)}>
                <Box marginRight="sp12">{icon}</Box>

                <VStack spacing="sp2" style={applyStyle(contentStyle)}>
                    <Text>{title}</Text>
                    {description}
                    <AccountTypeBadge accountKey={accountKey} alignSelf="flex-start" />
                </VStack>

                <VStack spacing="sp2" style={applyStyle(valuesStyle)}>
                    {value}
                    {valueDescription}
                </VStack>

                <Box marginLeft="sp12">
                    <Icon name="caretRight" size="mediumLarge" color="contentSecondary" />
                </Box>
            </PressableOpacity>

            {alerts}
        </Card>
    );
};
