import { useEffect } from 'react';
import Animated, {
    useAnimatedStyle,
    useSharedValue,
    withRepeat,
    withTiming,
} from 'react-native-reanimated';

import { ENDLESS_ANIMATION_VALUE } from '@suite-native/atoms';
import { Icon } from '@suite-native/icons';
import { prepareNativeStyle, useNativeStyles } from '@trezor/styles-native';
import { TransactionReviewOutputState } from '@suite-common/wallet-types';

const BADGE_SIZE = 14;
const ANIMATION_DURATION = 550;
const BORDER_WIDTH_MIN = 3;
const BORDER_WIDTH_MAX = 4;

const badgeStyle = prepareNativeStyle<{ isActive: boolean }>((utils, { isActive }) => ({
    width: BADGE_SIZE,
    height: BADGE_SIZE,
    borderRadius: utils.borders.radii.round,
    backgroundColor: utils.colors.elementFillNeutralSofter,
    borderColor: utils.colors.elementBorderNeutralSofter,

    extend: {
        condition: isActive,
        style: {
            backgroundColor: utils.colors.elementFillBrandBold,
            borderColor: utils.colors.contentBrand,
        },
    },
}));

export interface TransactionReviewOutputItemBadgeProps {
    status: TransactionReviewOutputState;
}

export const TransactionReviewOutputItemBadge = ({
    status,
}: TransactionReviewOutputItemBadgeProps) => {
    const { applyStyle } = useNativeStyles();

    const borderWidthValue = useSharedValue(BORDER_WIDTH_MIN);

    const animatedBadgeStyle = useAnimatedStyle(() => ({
        borderWidth: borderWidthValue.value,
    }));

    useEffect(() => {
        borderWidthValue.value = withRepeat(
            withTiming(BORDER_WIDTH_MAX, { duration: ANIMATION_DURATION }),
            ENDLESS_ANIMATION_VALUE,
            true,
        );
    }, [status, borderWidthValue]);

    if (status === 'success') {
        return <Icon name="checkCircleFilled" color="contentBrand" size="medium" />;
    }

    const isActive = status === 'active';

    return <Animated.View style={[animatedBadgeStyle, applyStyle(badgeStyle, { isActive })]} />;
};
