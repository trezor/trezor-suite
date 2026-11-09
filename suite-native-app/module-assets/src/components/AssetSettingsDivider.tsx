import { Divider } from '@suite-native/atoms';
import { prepareNativeStyle, useNativeStyles } from '@trezor/styles-native';

const fullWidthDividerStyle = prepareNativeStyle(utils => ({
    marginHorizontal: -utils.spacings.sp16,
}));

export const AssetSettingsDivider = () => {
    const { applyStyle } = useNativeStyles();

    return <Divider style={applyStyle(fullWidthDividerStyle)} />;
};
