import { Box, Divider } from '@suite-native/atoms';
import { prepareNativeStyle, useNativeStyles } from '@trezor/styles-native';

import { ExchangeAssetsSwitchButton } from './ExchangeAssetsSwitchButton';

const switchDividerStyle = prepareNativeStyle(({ borders }) => ({
    height: borders.widths.small,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 1,
}));

const dividerLineStyle = prepareNativeStyle(({ colors }) => ({
    borderBottomColor: colors.surfaceBorderRaised,
}));

const switchButtonContainerStyle = prepareNativeStyle(({ colors }) => ({
    position: 'absolute',
    backgroundColor: colors.surfaceFillRaised,
}));

export const ExchangeAssetsSwitchDivider = () => {
    const { applyStyle } = useNativeStyles();

    return (
        <Box style={applyStyle(switchDividerStyle)}>
            <Divider style={applyStyle(dividerLineStyle)} />
            <Box style={applyStyle(switchButtonContainerStyle)}>
                <ExchangeAssetsSwitchButton />
            </Box>
        </Box>
    );
};
