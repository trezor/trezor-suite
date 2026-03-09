import { useMemo } from 'react';
import Animated, { SlideInDown, SlideOutDown } from 'react-native-reanimated';

import { useFormatters } from '@suite-common/formatters';
import { NetworkSymbol } from '@suite-common/wallet-config';
import { AccountKey } from '@suite-common/wallet-types';
import { calculateRewards } from '@suite-common/wallet-utils';
import { Box, Button, ScreenFooterGradient, Text, VStack } from '@suite-native/atoms';
import { Translation, useTranslate } from '@suite-native/intl';
import { selectAPYByAccountKey, useSelector } from '@suite-native/staking';
import { prepareNativeStyle, useNativeStyles } from '@trezor/styles';

const screenFooterStyle = prepareNativeStyle(utils => ({
    paddingHorizontal: utils.spacings.sp16,
    paddingBottom: 0,
    backgroundColor: utils.colors.backgroundSurfaceElevation0,
}));

const rewardsBoxStyle = prepareNativeStyle(utils => ({
    backgroundColor: utils.colors.backgroundPrimarySubtleOnElevationNegative,
    borderTopLeftRadius: utils.borders.radii.r16,
    borderTopRightRadius: utils.borders.radii.r16,
    borderBottomLeftRadius: 24,
    borderBottomRightRadius: 24,
}));

type EarnFormScreenFooterProps = {
    accountKey: AccountKey;
    symbol: NetworkSymbol;
    amountValue: string;
    isFormValid: boolean;
    onPress: () => void;
};

export const EarnFormScreenFooter = ({
    accountKey,
    symbol,
    amountValue,
    isFormValid,
    onPress,
}: EarnFormScreenFooterProps) => {
    const { applyStyle } = useNativeStyles();
    const { translate } = useTranslate();
    const { CryptoAmountFormatter } = useFormatters();

    const apy = useSelector(state => selectAPYByAccountKey(state, accountKey));

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

    const isButtonDisabled = !isFormValid;
    const buttonColorScheme = isButtonDisabled ? 'tertiaryElevation0' : 'primary';

    return (
        <Animated.View entering={SlideInDown} exiting={SlideOutDown}>
            <ScreenFooterGradient />
            <Box style={applyStyle(screenFooterStyle)}>
                <Box style={applyStyle(rewardsBoxStyle)}>
                    <VStack spacing="sp4" paddingVertical="sp12" alignItems="center">
                        <Text variant="body-sm" color="textDefault">
                            <Translation id="earn.earnFormScreen.estimatedRewardsLabel" />
                        </Text>
                        <Text variant="headline-sm" color="textPrimaryDefault">
                            {estimatedRewards ?? (
                                <Translation id="earn.earnFormScreen.estimatedRewardsPlaceholder" />
                            )}
                        </Text>
                    </VStack>
                    <Button
                        key={buttonColorScheme}
                        accessibilityRole="button"
                        accessibilityLabel={translate('generic.validateForm')}
                        colorScheme={buttonColorScheme}
                        onPress={onPress}
                        isDisabled={isButtonDisabled}
                    >
                        <Translation id="generic.buttons.continue" />
                    </Button>
                </Box>
            </Box>
        </Animated.View>
    );
};
