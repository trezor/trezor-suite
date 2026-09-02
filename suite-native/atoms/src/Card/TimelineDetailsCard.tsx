import React, { type ReactNode, useMemo } from 'react';

import { Icon, type IconName } from '@suite-native/icons';
import { prepareNativeStyle, useNativeStyles } from '@trezor/styles-native';

import { Box } from '../Box';
import { OrderedListIcon } from '../OrderedListIcon';
import { HStack, VStack } from '../Stack';
import { Text } from '../Text';
import { Card } from './Card';

export type TimelineDetailsCardItem = {
    id: string;
    title: ReactNode;
    description?: ReactNode;
    descriptionContainer?: ({ children }: { children: ReactNode }) => ReactNode;
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
    alignItems: 'center',
}));

const itemTitleContainerStyle = prepareNativeStyle(() => ({
    flex: 1,
    minWidth: 0,
    alignItems: 'center',
}));

const itemTitleStyle = prepareNativeStyle(() => ({
    flexShrink: 1,
}));

const itemDescriptionStyle = prepareNativeStyle(() => ({
    flexShrink: 0,
}));

const defaultItemIconProps = {
    iconSize: 'large',
    iconColor: 'contentBrand',
    iconBackgroundColor: 'elementFillBrandSofter',
    iconBorderColor: 'elementBorderBrandSofter',
} as const;

const renderDefaultItemIcon = (index: number) => (
    <OrderedListIcon iconNumber={index + 1} {...defaultItemIconProps} />
);

interface TimelineDetailsCardItemComponentProps {
    item: TimelineDetailsCardItem;
    index: number;
    renderItemIcon?: (params: { item: TimelineDetailsCardItem; index: number }) => ReactNode;
}

const TimelineDetailsCardItemComponent = ({
    item,
    index,
    renderItemIcon,
}: TimelineDetailsCardItemComponentProps) => {
    const { applyStyle } = useNativeStyles();

    const itemIcon = useMemo(
        () => item.icon ?? renderItemIcon?.({ item, index }) ?? renderDefaultItemIcon(index),
        [item, index, renderItemIcon],
    );

    const itemTitle = useMemo(
        () => (
            <Text variant="body-sm-strong" style={applyStyle(itemTitleStyle)}>
                {item.title}
            </Text>
        ),
        [item.title, applyStyle],
    );

    const itemDescription = useMemo(() => {
        if (!item.description) return null;

        const Container = item.descriptionContainer ?? React.Fragment;

        return (
            <Container>
                <Text
                    variant="body-sm"
                    color="contentSecondary"
                    numberOfLines={1}
                    style={applyStyle(itemDescriptionStyle)}
                >
                    {item.description}
                </Text>
            </Container>
        );
    }, [item, applyStyle]);

    return (
        <HStack spacing="sp8" alignItems="flex-start" style={applyStyle(itemRowStyle)}>
            <HStack
                spacing="sp12"
                alignItems="flex-start"
                style={applyStyle(itemTitleContainerStyle)}
            >
                {itemIcon}
                {itemTitle}
            </HStack>

            {itemDescription}
        </HStack>
    );
};

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
                        <TimelineDetailsCardItemComponent
                            key={item.id}
                            item={item}
                            index={index}
                            renderItemIcon={renderItemIcon}
                        />
                    ))}
                </VStack>
            </VStack>
        </Card>
    );
};
