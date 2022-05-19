import React from 'react';
import { TouchableOpacity, TouchableOpacityProps, View } from 'react-native';
import { BaseListItem } from './listItemTypes';
import { Icon } from '../Icon/Icon';
import { prepareNativeStyle, useNativeStyles } from '@trezor/styles';
import { ListItemIcon } from './ListItemIcon';
import { ListItemText } from './ListItemText';
import { Box } from '../Box';

interface ListItemProps extends BaseListItem, Omit<TouchableOpacityProps, 'style' | 'onPress'> {
    hasRightArrow: boolean;
}

const listItemRightArrowContainerStyle = prepareNativeStyle(utils => ({
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: utils.spacings.md,
}));

export const ListItem = ({
    iconType,
    title,
    subtitle,
    hasRightArrow,
    style,
    onPress,
    isTextTruncated = false,
    ...props
}: ListItemProps) => {
    const { applyStyle } = useNativeStyles();

    return (
        <TouchableOpacity disabled={!onPress} onPress={onPress} {...props}>
            <Box style={style} flexDirection="row">
                {iconType && <ListItemIcon iconType={iconType} />}
                <ListItemText title={title} subtitle={subtitle} isTextTruncated={isTextTruncated} />
                {hasRightArrow && (
                    <View style={applyStyle(listItemRightArrowContainerStyle)}>
                        <Icon type="chevronRight" />
                    </View>
                )}
            </Box>
        </TouchableOpacity>
    );
};
