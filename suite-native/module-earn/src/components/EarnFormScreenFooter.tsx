import { useMemo } from 'react';
import Animated, { SlideInDown, SlideOutDown } from 'react-native-reanimated';
import { useSelector } from 'react-redux';

import { type NetworkSymbol, getNetworkDisplaySymbol } from '@suite-common/wallet-config';
import { calculateRewards } from '@suite-common/wallet-utils';
import { Box, Button, ScreenFooterGradient, Text, VStack } from '@suite-native/atoms';
import { Translation, selectSupportedLanguageLocale, useTranslate } from '@suite-native/intl';
import { selectApy, useSelector as useStakingSelector } from '@suite-native/staking';
import { prepareNativeStyle, useNativeStyles } from '@trezor/styles-native';

import { formatEarnTokenAmount } from '../utils/earnAmountUtils';

const screenFooterStyle = prepareNativeStyle(utils => ({
    paddingHorizontal: utils.spacings.sp16,
    paddingBottom: utils.spacings.sp16,
    backgroundColor: utils.colors.surfaceFillPage,
}));

const rewardsBoxStyle = prepareNativeStyle(utils => ({
    backgroundColor: utils.colors.elementFillBrandSoft,
    borderTopLeftRadius: utils.borders.radii.r16,
    borderTopRightRadius: utils.borders.radii.r16,
    borderBottomLeftRadius: utils.borders.radii.r24,
    borderBottomRightRadius: utils.borders.radii.r24,
    paddingBottom: utils.spacings.sp48,
}));

const continueButtonStyle = prepareNativeStyle<{ isRewardsBoxVisible: boolean }>(
    (utils, { isRewardsBoxVisible }) => ({
        borderRadius: utils.borders.radii.round,
        marginTop: isRewardsBoxVisible ? -utils.spacings.sp32 : 0,
    }),
);

type EarnFormScreenFooterProps = {
    symbol: NetworkSymbol;
    amountValue: string;
    isDisabled: boolean;
    onPress: () => void;
};

export const EarnFormScreenFooter = ({
    symbol,
    amountValue,
    isDisabled,
    onPress,
}: EarnFormScreenFooterProps) => {
    const { applyStyle } = useNativeStyles();
    const { translate } = useTranslate();
    const locale = useSelector(selectSupportedLanguageLocale);

    const apy = useStakingSelector(state => selectApy(state, { networkSymbol: symbol }));

    const estimatedRewards = useMemo(() => {
        if (!amountValue) return null;

        const rewards = calculateRewards(amountValue, apy);

        return formatEarnTokenAmount({
            amount: rewards,
            locale,
            symbol: getNetworkDisplaySymbol(symbol),
        });
    }, [amountValue, apy, locale, symbol]);

    const buttonIntent = isDisabled ? 'neutral' : 'brand';
    const buttonPriority = isDisabled ? 'secondary' : 'primary';
    const isRewardsBoxVisible = estimatedRewards !== null && !isDisabled;

    return (
        <Animated.View entering={SlideInDown} exiting={SlideOutDown}>
            <ScreenFooterGradient />
            <Box style={applyStyle(screenFooterStyle)}>
                {isRewardsBoxVisible && (
                    <Box style={applyStyle(rewardsBoxStyle)}>
                        <VStack
                            spacing="sp4"
                            paddingTop="sp12"
                            paddingHorizontal="sp16"
                            alignItems="center"
                        >
                            <Text variant="body-sm" color="contentPrimary" textAlign="center">
                                <Translation id="earn.earnFormScreen.estimatedRewardsLabel" />
                            </Text>
                            <Text variant="headline-sm" color="contentBrand" textAlign="center">
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
                    style={applyStyle(continueButtonStyle, { isRewardsBoxVisible })}
                >
                    <Translation id="generic.buttons.continue" />
                </Button>
            </Box>
        </Animated.View>
    );
};
