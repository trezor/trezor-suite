import { useAnimatedStyle, withTiming } from 'react-native-reanimated';

import { AnimatedBox, PressableOpacity, Text, VStack } from '@suite-native/atoms';
import { Icon } from '@suite-native/icons';
import { Translation } from '@suite-native/intl';
import { prepareNativeStyle, useNativeStyles } from '@trezor/styles-native';

import { PortfolioAssetsLoader } from './PortfolioAssetsLoader';

const CARET_ANIMATION_DURATION = 200;

const rowStyle = prepareNativeStyle(utils => ({
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: utils.spacings.sp16,
}));

type PortfolioAssetsShowMoreButtonProps = {
    isExpanded: boolean;
    isLoading: boolean;
    onPress: () => void;
};

export const PortfolioAssetsShowMoreButton = ({
    isExpanded,
    isLoading,
    onPress,
}: PortfolioAssetsShowMoreButtonProps) => {
    const { applyStyle } = useNativeStyles();

    const caretStyle = useAnimatedStyle(
        () => ({
            transform: [
                {
                    rotate: withTiming(isExpanded ? '-180deg' : '0deg', {
                        duration: CARET_ANIMATION_DURATION,
                    }),
                },
            ],
        }),
        [isExpanded],
    );

    return (
        <PressableOpacity
            onPress={onPress}
            style={applyStyle(rowStyle)}
            accessibilityRole="button"
            testID="@home/portfolio-assets/show-more"
        >
            <VStack spacing="sp4">
                <Text variant="body-md-strong" color="contentSecondary">
                    <Translation
                        id={
                            isExpanded ? 'moduleHome.assets.showLess' : 'moduleHome.assets.showMore'
                        }
                    />
                </Text>
                {isLoading && <PortfolioAssetsLoader />}
            </VStack>
            <AnimatedBox style={caretStyle}>
                <Icon name="caretDown" size="medium" color="contentSecondary" />
            </AnimatedBox>
        </PressableOpacity>
    );
};
