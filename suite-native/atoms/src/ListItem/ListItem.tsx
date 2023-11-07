import { TouchableOpacity, TouchableOpacityProps, View } from 'react-native';

import { Icon } from '@suite-common/icons';
import { prepareNativeStyle, useNativeStyles } from '@trezor/styles';

import { Box } from '../Box';
import { ListItemIcon } from './ListItemIcon';
import { ListItemText } from './ListItemText';
import { BaseListItem } from './listItemTypes';

export interface ListItemProps
    extends BaseListItem,
        Omit<TouchableOpacityProps, 'style' | 'onPress'> {
    hasRightArrow?: boolean;
}

const listItemRightArrowContainerStyle = prepareNativeStyle(utils => ({
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: utils.spacings.m,
}));

export const ListItem = ({
    iconName,
    title,
    subtitle,
    style,
    onPress,
    hasRightArrow = false,
    isTextTruncated = false,
    ...props
}: ListItemProps) => {
    const { applyStyle } = useNativeStyles();

    return (
        <TouchableOpacity disabled={!onPress} onPress={onPress} {...props}>
            <Box style={style} flexDirection="row">
                {iconName && <ListItemIcon iconName={iconName} />}
                <ListItemText title={title} subtitle={subtitle} isTextTruncated={isTextTruncated} />
                {hasRightArrow && (
                    <View style={applyStyle(listItemRightArrowContainerStyle)}>
                        <Icon name="circleRightLight" color="iconPrimaryDefault" />
                    </View>
                )}
            </Box>
        </TouchableOpacity>
    );
};
