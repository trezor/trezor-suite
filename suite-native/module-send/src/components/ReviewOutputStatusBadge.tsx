import { useEffect } from 'react';
import Animated, {
    useSharedValue,
    withRepeat,
    withTiming,
    useAnimatedStyle,
} from 'react-native-reanimated';

import { Icon } from '@suite-common/icons-deprecated';
import { ReviewOutputState } from '@suite-common/wallet-types';
import { prepareNativeStyle, useNativeStyles } from '@trezor/styles';
import { ENDLESS_ANIMATION_VALUE } from '@suite-native/helpers';

const BADGE_SIZE = 14;
const ANIMATION_DURATION = 550;
const BORDER_WIDTH_MIN = 3;
const BORDER_WIDTH_MAX = 4;

const badgeStyle = prepareNativeStyle<{ isActive: boolean }>((utils, { isActive }) => ({
    width: BADGE_SIZE,
    height: BADGE_SIZE,
    borderRadius: utils.borders.radii.round,
    backgroundColor: utils.colors.backgroundTertiaryDefaultOnElevation0,
    borderColor: utils.colors.backgroundTertiaryDefaultOnElevation0,

    extend: {
        condition: isActive,
        style: {
            backgroundColor: utils.colors.backgroundSecondaryDefault,
            borderColor: utils.colors.backgroundPrimarySubtleOnElevationNegative,
        },
    },
}));

export const ReviewOutputStatusBadge = ({ status }: { status: ReviewOutputState }) => {
    const { applyStyle } = useNativeStyles();

    const borderWidthValue = useSharedValue(BORDER_WIDTH_MIN);

    useEffect(() => {
        borderWidthValue.value = withRepeat(
            withTiming(BORDER_WIDTH_MAX, { duration: ANIMATION_DURATION }),
            ENDLESS_ANIMATION_VALUE,
            true,
        );
    }, [status, borderWidthValue]);

    const animatedBadgeStyle = useAnimatedStyle(() => ({
        borderWidth: borderWidthValue.value,
    }));

    if (status === 'success') {
        return (
            <Icon name="checkCircleSolidLight" color="backgroundSecondaryDefault" size="medium" />
        );
    }

    const isActive = status === 'active';

    return (
        <Animated.View
            style={[animatedBadgeStyle, applyStyle(badgeStyle, { isActive })]}
        ></Animated.View>
    );
};
