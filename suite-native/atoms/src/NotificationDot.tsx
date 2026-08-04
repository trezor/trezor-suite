import { View } from 'react-native';

import { prepareNativeStyle, useNativeStyles } from '@trezor/styles-native';

const notificationDotStyle = prepareNativeStyle(utils => ({
    width: utils.spacings.sp10,
    height: utils.spacings.sp10,
    borderRadius: utils.borders.radii.round,
    backgroundColor: utils.colors.elementFillCriticalBold,
    borderColor: utils.colors.surfaceFillAction,
    borderWidth: utils.borders.widths.large,
}));

export const NotificationDot = () => {
    const { applyStyle } = useNativeStyles();

    return <View style={applyStyle(notificationDotStyle)} />;
};
