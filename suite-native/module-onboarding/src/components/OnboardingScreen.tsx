import { ReactNode, useMemo } from 'react';
import { Dimensions, ImageBackground } from 'react-native';

import { Screen } from '@suite-native/navigation';
import { Box } from '@suite-native/atoms';
import { prepareNativeStyle, useNativeStyles } from '@trezor/styles';
import { useActiveColorScheme } from '@suite-native/theme';

import { OnboardingScreenHeader } from './OnboardingScreenHeader';

type OnboardingScreenProps = {
    children: ReactNode;
    footer?: ReactNode;
    title: string;
    subtitle?: string;
    activeStep: number;
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
    backgroundColor: utils.colors.backGroundOnboardingCard,
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
    footer,
    title,
    subtitle,
    activeStep,
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
            <Screen
                isScrollable={isScrollable}
                backgroundColor="transparent"
                isHeaderDisplayed={false}
            >
                <Box
                    alignItems="center"
                    flex={1}
                    justifyContent="space-between"
                    style={applyStyle(cardStyle)}
                >
                    <OnboardingScreenHeader
                        title={title}
                        subtitle={subtitle}
                        activeStep={activeStep}
                    />
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
