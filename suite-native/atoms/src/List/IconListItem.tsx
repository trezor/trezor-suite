import { type ReactNode, useContext } from 'react';

import { type IconName } from '@suite-native/icons';
import { prepareNativeStyle, useNativeStyles } from '@trezor/styles-native';

import { Box } from '../Box';
import { IconSquare, type IconSquareIntent } from '../Icon/IconSquare';
import { HStack, VStack } from '../Stack';
import { Text } from '../Text';
import { IconListContext } from './IconList';

export type IconListItemProps = {
    icon: IconName;
    intent?: IconSquareIntent;
    children: ReactNode;
};

export type IconListTextItemProps = IconListItemProps;

export type IconListTitledItemProps = IconListItemProps & {
    title: ReactNode;
};

const itemStyle = prepareNativeStyle(() => ({
    width: '100%',
}));

export const IconListItem = ({ icon, intent, children }: IconListItemProps) => {
    const { iconIntent, iconSize, verticalAlign = 'center' } = useContext(IconListContext);
    const { applyStyle } = useNativeStyles();

    return (
        <HStack spacing="sp12" alignItems={verticalAlign} style={applyStyle(itemStyle)}>
            <IconSquare icon={icon} intent={intent ?? iconIntent} size={iconSize} />
            <Box flexShrink={1}>{children}</Box>
        </HStack>
    );
};

export const IconListTextItem = ({ children, ...rest }: IconListTextItemProps) => {
    const { textVariant = 'body-sm' } = useContext(IconListContext);

    return (
        <IconListItem {...rest}>
            <Text variant={textVariant}>{children}</Text>
        </IconListItem>
    );
};

export const IconListTitledItem = ({ title, children, ...rest }: IconListTitledItemProps) => (
    <IconListItem {...rest}>
        <VStack spacing="sp4">
            <Text variant="body-md-strong">{title}</Text>
            <Text variant="body-sm" color="contentSecondary">
                {children}
            </Text>
        </VStack>
    </IconListItem>
);
