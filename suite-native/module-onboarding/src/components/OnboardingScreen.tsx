import { ReactNode, useMemo } from 'react';
import { Dimensions, ImageBackground, Platform } from 'react-native';

import { Screen } from '@suite-native/navigation';
import { Box } from '@suite-native/atoms';
import { prepareNativeStyle, useNativeStyles } from '@trezor/styles';
import { useActiveColorScheme } from '@suite-native/theme';

type OnboardingScreenProps = {
    children: ReactNode;
    header?: ReactNode;
    footer?: ReactNode;
    isScrollable?: boolean;
};

const contentStyle = prepareNativeStyle(utils => ({
    flex: 1,
    backgroundColor: utils.colors.backgroundSurfaceElevation0,
    alignItems: 'center',
}));

const cardStyle = prepareNativeStyle(utils => ({
    marginHorizontal: utils.spacings.medium,
    marginTop: utils.spacings.medium,
    paddingTop: utils.spacings.large,
    borderRadius: 20,
    borderWidth: utils.borders.widths.small,
    borderColor: utils.colors.borderElevation1,
    backgroundColor: utils.transparentize(0.3, utils.colors.backgroundSurfaceElevation1),
    ...(Platform.OS === 'ios' ? utils.boxShadows.small : {}),
    width: Dimensions.get('window').width - 48,
}));

const imageContainerStyle = prepareNativeStyle(() => ({
    position: 'absolute',
    left: 0,
    top: 0,
    right: 0,
    aspectRatio: 390 / 296,
}));

export const OnboardingScreen = ({
    children,
    header,
    footer,
    isScrollable = true,
}: OnboardingScreenProps) => {
    const { applyStyle } = useNativeStyles();
    const colorScheme = useActiveColorScheme();

    const getImageSource = useMemo(() => {
        if (colorScheme === 'dark') {
            return require('../assets/darkRectangles.png');
        }

        return require('../assets/rectangles.png');
    }, [colorScheme]);

    return (
        <Box style={applyStyle(contentStyle)}>
            <ImageBackground
                source={getImageSource}
                resizeMode="cover"
                style={applyStyle(imageContainerStyle)}
            />
            <Screen isScrollable={isScrollable} backgroundColor="transparent">
                <Box
                    flex={1}
                    alignItems="center"
                    justifyContent="space-between"
                    style={applyStyle(cardStyle)}
                >
                    {header}
                    {children}
                </Box>
                {footer && (
                    <Box alignItems="center" marginTop="large">
                        {footer}
                    </Box>
                )}
            </Screen>
        </Box>
    );
};
