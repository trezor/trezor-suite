import { type ReactNode } from 'react';

import { Icon, type IconName } from '@suite-native/icons';
import { prepareNativeStyle, useNativeStyles } from '@trezor/styles-native';

import { Box } from '../Box';
import { Card } from './Card';
import { OrderedListIcon } from '../OrderedListIcon';
import { HStack, VStack } from '../Stack';
import { Text } from '../Text';

export type TimelineDetailsCardItem = {
    id: string;
    title: ReactNode;
    description?: ReactNode;
    icon?: ReactNode;
};

type TimelineDetailsCardProps = {
    headerTitle: ReactNode;
    headerIconName?: IconName;
    items: TimelineDetailsCardItem[];
    renderItemIcon?: (params: { item: TimelineDetailsCardItem; index: number }) => ReactNode;
};

const headerRowStyle = prepareNativeStyle(utils => ({
    alignItems: 'center',
    paddingVertical: utils.spacings.sp12,
}));

const separatorStyle = prepareNativeStyle(utils => ({
    borderBottomWidth: utils.borders.widths.small,
    borderBottomColor: utils.colors.borderNeutral,
}));

const itemRowStyle = prepareNativeStyle(() => ({
    width: '100%',
    justifyContent: 'space-between',
}));

const defaultItemIconProps = {
    iconSize: 'large',
    iconColor: 'contentBrand',
    iconBackgroundColor: 'legacyBackgroundPrimarySubtleOnElevation1',
    iconBorderColor: 'legacyBackgroundPrimarySubtleOnElevationNegative',
} as const;

const renderDefaultItemIcon = (index: number) => (
    <OrderedListIcon iconNumber={index + 1} {...defaultItemIconProps} />
);

export const TimelineDetailsCard = ({
    headerTitle,
    headerIconName,
    items,
    renderItemIcon,
}: TimelineDetailsCardProps) => {
    const { applyStyle } = useNativeStyles();

    return (
        <Card borderColor="borderNeutral" noPadding>
            <VStack spacing={0}>
                <Box paddingHorizontal="sp16">
                    <HStack spacing="sp8" style={applyStyle(headerRowStyle)}>
                        {headerIconName && (
                            <Icon name={headerIconName} color="contentSecondary" size={20} />
                        )}
                        <Text variant="body-md" color="contentSecondary">
                            {headerTitle}
                        </Text>
                    </HStack>
                </Box>
                <Box style={applyStyle(separatorStyle)} />
                <VStack spacing="sp16" padding="sp16">
                    {items.map((item, index) => (
                        <HStack
                            key={item.id}
                            spacing="sp8"
                            alignItems="center"
                            style={applyStyle(itemRowStyle)}
                        >
                            <HStack spacing="sp12" alignItems="center">
                                {item.icon ??
                                    renderItemIcon?.({ item, index }) ??
                                    renderDefaultItemIcon(index)}
                                <Text variant="body-sm-strong" numberOfLines={1}>
                                    {item.title}
                                </Text>
                            </HStack>
                            {item.description && (
                                <Text variant="body-sm" color="contentSecondary" numberOfLines={1}>
                                    {item.description}
                                </Text>
                            )}
                        </HStack>
                    ))}
                </VStack>
            </VStack>
        </Card>
    );
};
