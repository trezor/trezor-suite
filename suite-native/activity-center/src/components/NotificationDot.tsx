import { View } from 'react-native';

import { prepareNativeStyle, useNativeStyles } from '@trezor/styles-native';

const notificationDotStyle = prepareNativeStyle(utils => ({
    width: utils.spacings.sp8,
    height: utils.spacings.sp8,
    backgroundColor: utils.colors.elementFillCriticalBold,
    borderRadius: utils.borders.radii.round,
    outlineColor: utils.colors.surfaceFillAction,
    outlineWidth: utils.borders.widths.large,
}));

export const NotificationDot = () => {
    const { applyStyle } = useNativeStyles();

    return <View style={applyStyle(notificationDotStyle)} />;
};
