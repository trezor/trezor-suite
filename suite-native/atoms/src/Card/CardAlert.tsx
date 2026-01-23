import { View } from 'react-native';

import { prepareNativeStyle, useNativeStyles } from '@trezor/styles';

import { InlineAlertBox, InlineAlertBoxProps } from '../InlineAlertBox/InlineAlertBox';

type CardAlertProps = {
    alertProps: InlineAlertBoxProps;
    position?: 'top' | 'bottom';
    testID?: string;
};

const headerFooterWrapperStyle = prepareNativeStyle<{
    position: 'top' | 'bottom';
}>((utils, { position }) => ({
    backgroundColor: utils.colors.backgroundSurfaceElevation1,
    paddingHorizontal: utils.spacings.sp4,
    extend: [
        {
            condition: position === 'top',
            style: {
                borderTopLeftRadius: utils.borders.radii.r16,
                borderTopRightRadius: utils.borders.radii.r16,
                paddingTop: utils.spacings.sp4,
            },
        },
        {
            condition: position === 'bottom',
            style: {
                borderBottomLeftRadius: utils.borders.radii.r16,
                borderBottomRightRadius: utils.borders.radii.r16,
                paddingBottom: utils.spacings.sp4,
            },
        },
    ],
}));

export const CardAlert = ({ position = 'top', alertProps, testID }: CardAlertProps) => {
    const { applyStyle } = useNativeStyles();

    return (
        <View style={applyStyle(headerFooterWrapperStyle, { position })} testID={testID}>
            <InlineAlertBox {...alertProps} />
        </View>
    );
};
