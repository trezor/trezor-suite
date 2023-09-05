import { TouchableOpacity, TouchableOpacityProps } from 'react-native';

import { Box } from '../Box';
import { Radio, RadioProps } from '../Radio';
import { ListItemIcon } from './ListItemIcon';
import { ListItemText } from './ListItemText';
import { BaseListItem } from './listItemTypes';

type SelectableListItemProps = RadioProps &
    Omit<BaseListItem, 'onPress'> &
    Omit<TouchableOpacityProps, 'style' | 'onPress'>;

export const SelectableListItem = ({
    iconName,
    title,
    subtitle,
    style,
    value,
    onPress,
    isTextTruncated = false,
    isChecked = false,
    isDisabled = false,
    ...props
}: SelectableListItemProps) => {
    const handlePress = () => {
        if (isDisabled) return;
        onPress(value);
    };

    return (
        <TouchableOpacity
            disabled={isDisabled}
            accessibilityState={{ checked: isChecked, disabled: isDisabled }}
            onPress={handlePress}
            {...props}
        >
            <Box style={style} flexDirection="row">
                {iconName && <ListItemIcon iconName={iconName} />}
                <ListItemText title={title} subtitle={subtitle} isTextTruncated={isTextTruncated} />
                <Box justifyContent="center" alignItems="flex-end" flex={1}>
                    <Radio
                        key={value}
                        value={value}
                        onPress={handlePress}
                        isChecked={isChecked}
                        isDisabled={isDisabled}
                    />
                </Box>
            </Box>
        </TouchableOpacity>
    );
};
