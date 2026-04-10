import { useMemo } from 'react';
import Animated, { SlideInDown, SlideOutDown } from 'react-native-reanimated';

import { useFormatters } from '@suite-common/formatters';
import { type NetworkSymbol } from '@suite-common/wallet-config';
import { type AccountKey } from '@suite-common/wallet-types';
import { calculateRewards } from '@suite-common/wallet-utils';
import { Box, Button, ScreenFooterGradient, Text, VStack } from '@suite-native/atoms';
import { Translation, useTranslate } from '@suite-native/intl';
import { selectApy, useSelector } from '@suite-native/staking';
import { prepareNativeStyle, useNativeStyles } from '@trezor/styles-native';

const screenFooterStyle = prepareNativeStyle(utils => ({
    paddingHorizontal: utils.spacings.sp16,
    paddingBottom: 0,
    backgroundColor: utils.colors.backgroundSurfaceElevation0,
}));

const rewardsBoxStyle = prepareNativeStyle(utils => ({
    backgroundColor: utils.colors.backgroundPrimarySubtleOnElevationNegative,
    borderTopLeftRadius: utils.borders.radii.r16,
    borderTopRightRadius: utils.borders.radii.r16,
    borderBottomLeftRadius: utils.borders.radii.r24,
    borderBottomRightRadius: utils.borders.radii.r24,
}));

type EarnFormScreenFooterProps = {
    accountKey: AccountKey;
    symbol: NetworkSymbol;
    amountValue: string;
    isDisabled: boolean;
    onPress: () => void;
};

export const EarnFormScreenFooter = ({
    accountKey,
    symbol,
    amountValue,
    isDisabled,
    onPress,
}: EarnFormScreenFooterProps) => {
    const { applyStyle } = useNativeStyles();
    const { translate } = useTranslate();
    const { CryptoAmountFormatter } = useFormatters();

    const apy = useSelector(state => selectApy(state, { accountKey, networkSymbol: symbol }));

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
                        key={`${buttonIntent}-${buttonPriority}`}
                        accessibilityRole="button"
                        accessibilityLabel={translate('generic.validateForm')}
                        intent={buttonIntent}
                        priority={buttonPriority}
                        onPress={onPress}
                        isDisabled={isDisabled}
                    >
                        <Translation id="generic.buttons.continue" />
                    </Button>
                </Box>
            </Box>
        </Animated.View>
    );
};
