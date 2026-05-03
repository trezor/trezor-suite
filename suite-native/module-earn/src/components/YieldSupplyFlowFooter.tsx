import { useMemo } from 'react';
import { Keyboard } from 'react-native';
import Animated, { SlideInDown, SlideOutDown } from 'react-native-reanimated';

import { useFormatters } from '@suite-common/formatters';
import { type TokenSymbol } from '@suite-common/wallet-types';
import { calculateRewards } from '@suite-common/wallet-utils';
import { Box, Button, ScreenFooterGradient, Text, VStack } from '@suite-native/atoms';
import { Translation, useTranslate } from '@suite-native/intl';
import { prepareNativeStyle, useNativeStyles } from '@trezor/styles-native';

const screenFooterStyle = prepareNativeStyle(utils => ({
    paddingHorizontal: utils.spacings.sp16,
    paddingBottom: utils.spacings.sp16,
    backgroundColor: utils.colors.surfaceFillPage,
}));

const rewardsBoxStyle = prepareNativeStyle(utils => ({
    backgroundColor: utils.colors.legacyBackgroundPrimarySubtleOnElevation0,
    borderTopLeftRadius: utils.borders.radii.r16,
    borderTopRightRadius: utils.borders.radii.r16,
    borderBottomLeftRadius: utils.borders.radii.r24,
    borderBottomRightRadius: utils.borders.radii.r24,
}));

type YieldSupplyFlowFooterProps = {
    amountValue: string | undefined;
    apy: number | null;
    isDisabled: boolean;
    isLoading?: boolean;
    onPress: () => void;
    tokenSymbol: TokenSymbol;
};

export const YieldSupplyFlowFooter = ({
    amountValue,
    apy,
    isDisabled,
    isLoading = false,
    onPress,
    tokenSymbol,
}: YieldSupplyFlowFooterProps) => {
    const { applyStyle } = useNativeStyles();
    const { translate } = useTranslate();
    const { CryptoAmountFormatter } = useFormatters();

    const handlePress = () => {
        Keyboard.dismiss();
        onPress();
    };

    const estimatedRewards = useMemo(() => {
        if (!amountValue || apy === null) return null;

        const rewards = calculateRewards(amountValue, apy);

        return CryptoAmountFormatter.format(rewards, {
            symbol: tokenSymbol,
            isBalance: true,
            withSymbol: true,
            isEllipsisAppended: false,
            maxDisplayedDecimals: 8,
        });
    }, [amountValue, apy, CryptoAmountFormatter, tokenSymbol]);

    const isEstimatedRewardsVisible = !isDisabled && estimatedRewards !== null;

    return (
        <Animated.View entering={SlideInDown} exiting={SlideOutDown}>
            <ScreenFooterGradient />
            <Box style={applyStyle(screenFooterStyle)}>
                <Box style={isEstimatedRewardsVisible ? applyStyle(rewardsBoxStyle) : undefined}>
                    {isEstimatedRewardsVisible && (
                        <VStack spacing="sp4" paddingVertical="sp12" alignItems="center">
                            <Text variant="body-sm" color="contentPrimary">
                                <Translation id="earn.yieldSupplyFlowScreen.estimatedRewardsLabel" />
                            </Text>
                            <Text variant="headline-sm" color="contentBrand">
                                {estimatedRewards}
                            </Text>
                        </VStack>
                    )}
                    <Button
                        accessibilityRole="button"
                        accessibilityLabel={translate('generic.buttons.continue')}
                        onPress={handlePress}
                        isDisabled={isDisabled}
                        isLoading={isLoading}
                    >
                        <Translation id="generic.buttons.continue" />
                    </Button>
                </Box>
            </Box>
        </Animated.View>
    );
};
