import { useMemo } from 'react';
import Animated, { SlideInDown, SlideOutDown } from 'react-native-reanimated';
import { useSelector } from 'react-redux';

import { type YieldApprovalAction } from '@suite-common/wallet-core';
import { type TokenSymbol } from '@suite-common/wallet-types';
import { calculateRewards } from '@suite-common/wallet-utils';
import { Box, Button, ScreenFooterGradient, Text, VStack } from '@suite-native/atoms';
import {
    Translation,
    type TxKeyPath,
    selectSupportedLanguageLocale,
    useTranslate,
} from '@suite-native/intl';
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
}));

type YieldDepositFlowFooterProps = {
    amountValue: string | undefined;
    apy: number | null;
    approvalAction?: YieldApprovalAction;
    isDisabled: boolean;
    isLoading?: boolean;
    isSkipDisabled?: boolean;
    onPress: () => void;
    onSkipPress?: () => void;
    shouldKeepEstimatedRewardsVisible?: boolean;
    tokenSymbol: TokenSymbol;
};

const getSubmitButtonTranslationId = (
    approvalAction?: YieldDepositFlowFooterProps['approvalAction'],
): TxKeyPath => {
    if (approvalAction === 'revoke') {
        return 'earn.yieldDepositFlowScreen.revokeApproval';
    }

    if (approvalAction === 'increase') {
        return 'earn.yieldDepositFlowScreen.increaseApprovalLimit';
    }

    return 'generic.buttons.continue';
};

export const YieldDepositFlowFooter = ({
    amountValue,
    apy,
    approvalAction,
    isDisabled,
    isLoading = false,
    isSkipDisabled = false,
    onPress,
    onSkipPress,
    shouldKeepEstimatedRewardsVisible = false,
    tokenSymbol,
}: YieldDepositFlowFooterProps) => {
    const { applyStyle } = useNativeStyles();
    const { translate } = useTranslate();
    const locale = useSelector(selectSupportedLanguageLocale);

    const estimatedRewards = useMemo(() => {
        if (!amountValue || apy === null) return null;

        const rewards = calculateRewards(amountValue, apy);

        return formatEarnTokenAmount({ amount: rewards, locale, symbol: tokenSymbol });
    }, [amountValue, apy, locale, tokenSymbol]);

    const buttonTranslationId = getSubmitButtonTranslationId(approvalAction);
    const isApprovalLimitAction = approvalAction === 'increase' || approvalAction === 'revoke';
    const isEstimatedRewardsVisible =
        (shouldKeepEstimatedRewardsVisible || (!isApprovalLimitAction && !isDisabled)) &&
        estimatedRewards !== null;

    return (
        <Animated.View entering={SlideInDown} exiting={SlideOutDown}>
            <ScreenFooterGradient />
            <Box style={applyStyle(screenFooterStyle)}>
                <VStack spacing="sp12">
                    <Box
                        style={isEstimatedRewardsVisible ? applyStyle(rewardsBoxStyle) : undefined}
                    >
                        {isEstimatedRewardsVisible && (
                            <VStack
                                spacing="sp4"
                                paddingVertical="sp12"
                                paddingHorizontal="sp16"
                                alignItems="center"
                            >
                                <Text variant="body-sm" color="contentPrimary" textAlign="center">
                                    <Translation id="earn.yieldDepositFlowScreen.estimatedRewardsLabel" />
                                </Text>
                                <Text variant="headline-sm" color="contentBrand" textAlign="center">
                                    {estimatedRewards}
                                </Text>
                            </VStack>
                        )}
                        <Button
                            accessibilityRole="button"
                            accessibilityLabel={translate(buttonTranslationId)}
                            onPress={onPress}
                            isDisabled={isDisabled}
                            isLoading={isLoading}
                        >
                            <Translation id={buttonTranslationId} />
                        </Button>
                    </Box>
                    {onSkipPress && (
                        <Button
                            accessibilityRole="button"
                            accessibilityLabel={translate(
                                'earn.yieldDepositFlowScreen.skipApproval',
                            )}
                            intent="neutral"
                            priority="secondary"
                            onPress={onSkipPress}
                            isDisabled={isSkipDisabled}
                        >
                            <Translation id="earn.yieldDepositFlowScreen.skipApproval" />
                        </Button>
                    )}
                </VStack>
            </Box>
        </Animated.View>
    );
};
