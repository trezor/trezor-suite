import { Icon } from '@suite-native/icons';
import { useTranslate } from '@suite-native/intl';
import { prepareNativeStyle, useNativeStyles } from '@trezor/styles-native';

import { Box } from '../Box';
import { PressableOpacity } from '../Pressable';

type SwitchAmountsButtonProps = { onPress: () => void; label?: string };

const BUTTON_TOP_OFFSET = 42;
const BUTTON_PADDING = 6;

const buttonWrapperStyle = prepareNativeStyle(() => ({
    alignSelf: 'center',
    top: BUTTON_TOP_OFFSET,
    zIndex: 3, // To stay above both of the absolute inputs.
}));

const buttonStyle = prepareNativeStyle(utils => ({
    padding: BUTTON_PADDING,
    backgroundColor: utils.colors.backgroundTertiaryDefaultOnElevation1,
    borderColor: utils.colors.borderDashed,
    borderWidth: utils.borders.widths.small,
    borderRadius: utils.borders.radii.round,
}));

export const SwitchViewsButton = ({ onPress, label }: SwitchAmountsButtonProps) => {
    const { applyStyle } = useNativeStyles();
    const { translate } = useTranslate();

    return (
        <Box style={applyStyle(buttonWrapperStyle)}>
            <PressableOpacity
                style={applyStyle(buttonStyle)}
                onPress={onPress}
                accessibilityLabel={
                    label ?? translate('atoms.animatedDoubleView.defaultSwitchLabel')
                }
            >
                <Icon size="mediumLarge" name="arrowsCounterClockwise" />
            </PressableOpacity>
        </Box>
    );
};
