import { SlideInDown } from 'react-native-reanimated';

import { type NetworkSymbol, getNetworkDisplaySymbol } from '@suite-common/wallet-config';
import { AnimatedBox, Box, Button, ScreenFooterGradient } from '@suite-native/atoms';
import { Translation, useTranslate } from '@suite-native/intl';
import { selectApy, useSelector as useStakingSelector } from '@suite-native/staking';
import { prepareNativeStyle, useNativeStyles } from '@trezor/styles-native';

import { EarnEstimatedRewards } from './EarnEstimatedRewards';

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

    const apy = useStakingSelector(state => selectApy(state, { networkSymbol: symbol }));

    const buttonIntent = isDisabled ? 'neutral' : 'brand';
    const buttonPriority = isDisabled ? 'secondary' : 'primary';
    const isRewardsBoxVisible = !!amountValue && !isDisabled;

    return (
        <AnimatedBox entering={SlideInDown}>
            <ScreenFooterGradient />
            <Box style={applyStyle(screenFooterStyle)}>
                {isRewardsBoxVisible && (
                    <Box style={applyStyle(rewardsBoxStyle)}>
                        <Box paddingTop="sp12">
                            <EarnEstimatedRewards
                                amountValue={amountValue}
                                apy={apy}
                                label={
                                    <Translation id="earn.earnFormScreen.estimatedRewardsLabel" />
                                }
                                symbol={getNetworkDisplaySymbol(symbol)}
                            />
                        </Box>
                    </Box>
                )}
                <Button
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
        </AnimatedBox>
    );
};
