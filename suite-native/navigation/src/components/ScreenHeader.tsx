import { Box, HStack, Text } from '@suite-native/atoms';
import { prepareNativeStyle, useNativeStyles } from '@trezor/styles';
import { Icon } from '@suite-common/icons';

import { ScreenHeaderWrapper } from './ScreenHeaderWrapper';

type ScreenHeaderProps = {
    hasBottomPadding?: boolean;
};

const SCREEN_HEADER_HEIGHT = 56;

const switchWrapperStyle = prepareNativeStyle(utils => ({
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    height: SCREEN_HEADER_HEIGHT,
    paddingVertical: utils.spacings.s,
    paddingHorizontal: utils.spacings.m,
    borderColor: utils.colors.borderOnElevation1,
    borderWidth: utils.borders.widths.large,
    borderRadius: utils.borders.radii.round,
    backgroundColor: utils.colors.backgroundSurfaceElevation1,
}));

export const ScreenHeader = ({ hasBottomPadding }: ScreenHeaderProps) => {
    const { applyStyle } = useNativeStyles();

    return (
        <ScreenHeaderWrapper marginBottom={hasBottomPadding ? 's' : undefined}>
            <HStack alignItems="center">
                <Box style={applyStyle(switchWrapperStyle)}>
                    <HStack>
                        <Icon name="trezor" />
                        <Text>Hi there!</Text>
                    </HStack>
                    {/* TODO this will be uncommented once this switch is functional */}
                    {/* <Icon name="chevronUpAndDown" /> */}
                </Box>
            </HStack>
        </ScreenHeaderWrapper>
    );
};
