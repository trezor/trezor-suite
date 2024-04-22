import { Box, Text } from '@suite-native/atoms';
import { Translation } from '@suite-native/intl';
import { prepareNativeStyle, useNativeStyles } from '@trezor/styles';

import { SecuredCoinsSvg } from '../../assets/SecuredCoinsSvg';
import { About, AboutProps } from './About';

const svgWrapperStyle = prepareNativeStyle(utils => ({
    width: 180,
    height: 156,
    paddingBottom: utils.spacings.large,
}));

const emptyContentStyle = prepareNativeStyle(utils => ({
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: utils.spacings.large,
}));

export const DevicesEmpty = ({ onPressAbout }: AboutProps) => {
    const { applyStyle } = useNativeStyles();

    return (
        <Box style={applyStyle(emptyContentStyle)}>
            <Box style={applyStyle(svgWrapperStyle)}>
                <SecuredCoinsSvg />
            </Box>
            <Text variant="titleSmall" textAlign="center">
                <Translation id="moduleSettings.viewOnly.emptyTitle" />
            </Text>
            <About onPressAbout={onPressAbout} />
        </Box>
    );
};
