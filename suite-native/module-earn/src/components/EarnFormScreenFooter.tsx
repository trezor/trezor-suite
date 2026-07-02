import { useMemo } from 'react';
import Animated, { SlideInDown, SlideOutDown } from 'react-native-reanimated';

import { useFormatters } from '@suite-common/formatters';
import { type NetworkSymbol } from '@suite-common/wallet-config';
import { calculateRewards } from '@suite-common/wallet-utils';
import { Box, Button, ScreenFooterGradient, Text, VStack } from '@suite-native/atoms';
import { Translation, useTranslate } from '@suite-native/intl';
import { selectApy, useSelector } from '@suite-native/staking';
import { prepareNativeStyle, useNativeStyles } from '@trezor/styles-native';

const screenFooterStyle = prepareNativeStyle(utils => ({
    paddingHorizontal: utils.spacings.sp16,
    paddingBottom: 0,
    backgroundColor: utils.colors.surfaceFillPage,
}));

const rewardsBoxStyle = prepareNativeStyle<{ hasValidationError: boolean }>(
    (utils, { hasValidationError }) => ({
        backgroundColor: utils.colors.legacyBackgroundPrimarySubtleOnElevationNegative,
        borderTopLeftRadius: utils.borders.radii.r16,
        borderTopRightRadius: utils.borders.radii.r16,
        borderBottomLeftRadius: utils.borders.radii.r24,
        borderBottomRightRadius: utils.borders.radii.r24,
        paddingBottom: utils.spacings.sp48,
        opacity: hasValidationError ? 0 : 1,
    }),
);

const continueButtonStyle = prepareNativeStyle<{ isEstimatedRewardsVisible: boolean }>(
    (utils, { isEstimatedRewardsVisible }) => ({
        borderRadius: utils.borders.radii.round,
        marginTop: isEstimatedRewardsVisible ? -utils.spacings.sp32 : 0,
    }),
);

type EarnFormScreenFooterProps = {
    symbol: NetworkSymbol;
    amountValue: string;
    isDisabled: boolean;
    isDirty: boolean;
    onPress: () => void;
};

export const EarnFormScreenFooter = ({
    symbol,
    amountValue,
    isDisabled,
    isDirty,
    onPress,
}: EarnFormScreenFooterProps) => {
    const { applyStyle } = useNativeStyles();
    const { translate } = useTranslate();
    const { CryptoAmountFormatter } = useFormatters();

    const apy = useSelector(state => selectApy(state, { networkSymbol: symbol }));

    const estimatedRewards = useMemo(() => {
        if (!amountValue) return null;

        const rewards = calculateRewards(amountValue, apy);

        return CryptoAmountFormatter.format(rewards, {
            symbol,
            isBalance: true,
            withSymbol: true,
            isEllipsisAppended: false,
            maxDisplayedDecimals: 8,
        });
    }, [amountValue, apy, CryptoAmountFormatter, symbol]);

    const buttonIntent = isDisabled ? 'neutral' : 'brand';
    const buttonPriority = isDisabled ? 'secondary' : 'primary';
    const hasValidationError = isDirty && isDisabled;
    const isEstimatedRewardsVisible = estimatedRewards !== null;

    return (
        <Animated.View entering={SlideInDown} exiting={SlideOutDown}>
            <ScreenFooterGradient />
            <Box style={applyStyle(screenFooterStyle)}>
                {isEstimatedRewardsVisible && (
                    <Box style={applyStyle(rewardsBoxStyle, { hasValidationError })}>
                        <VStack spacing="sp4" paddingTop="sp12" alignItems="center">
                            <Text variant="body-sm" color="contentPrimary">
                                <Translation id="earn.earnFormScreen.estimatedRewardsLabel" />
                            </Text>
                            <Text variant="headline-sm" color="contentBrand">
                                {estimatedRewards}
                            </Text>
                        </VStack>
                    </Box>
                )}
                <Button
                    key={`${buttonIntent}-${buttonPriority}`}
                    accessibilityRole="button"
                    accessibilityLabel={translate('generic.validateForm')}
                    intent={buttonIntent}
                    priority={buttonPriority}
                    onPress={onPress}
                    isDisabled={isDisabled}
                    style={applyStyle(continueButtonStyle, { isEstimatedRewardsVisible })}
                >
                    <Translation id="generic.buttons.continue" />
                </Button>
            </Box>
        </Animated.View>
    );
};
