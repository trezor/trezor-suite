import React, { type ReactNode, useMemo } from 'react';

import { prepareNativeStyle, useNativeStyles } from '@trezor/styles-native';

import { TimelineDetailsCardItemIcon } from './TimelineDetailsCardItemIcon';
import { HStack } from '../../../Stack';
import { Text } from '../../../Text';
import {
    type TimelineDetailsCardItem,
    type TimelineDetailsCardRenderItemIconParams,
} from '../types';

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

type TimelineDetailsCardItemComponentProps = {
    item: TimelineDetailsCardItem;
    index: number;
    renderItemIcon?: (params: TimelineDetailsCardRenderItemIconParams) => ReactNode;
};

export function TimelineDetailsCardItemComponent({
    item,
    index,
    renderItemIcon,
}: TimelineDetailsCardItemComponentProps) {
    const { applyStyle } = useNativeStyles();

    const itemIcon = useMemo(
        () =>
            item.icon ??
            renderItemIcon?.({ item, index }) ?? <TimelineDetailsCardItemIcon index={index} />,
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
}
