import { Text, View } from 'react-native';

import { type NativeStyleObject, prepareNativeStyle, useNativeStyles } from '@trezor/styles-native';

import { MAX_FONT_SIZE_MULTIPLIER } from './Icon';

type CryptoIconPlaceholderProps = {
    placeholder: string;
    containerStyle: NativeStyleObject;
};

const iconStyle = prepareNativeStyle(utils => ({
    backgroundColor: utils.colors.backgroundSurfaceElevation0,
    alignItems: 'center',
    justifyContent: 'center',
}));

const textStyle = prepareNativeStyle(utils => ({
    ...utils.typography['body-md'],
    color: utils.colors.textDefault,
    textAlign: 'center',
}));

export const CryptoIconPlaceholder = ({
    placeholder,
    containerStyle,
}: CryptoIconPlaceholderProps) => {
    const { applyStyle } = useNativeStyles();
    const firstChar = placeholder[0] || 'T';

    // due to circular deps issues we need to use Text and View comp from 'react-native' instead of 'atoms'
    return (
        <View style={[containerStyle, applyStyle(iconStyle)]}>
            <Text style={applyStyle(textStyle)} maxFontSizeMultiplier={MAX_FONT_SIZE_MULTIPLIER}>
                {firstChar}
            </Text>
        </View>
    );
};
