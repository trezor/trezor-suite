import { useMemo } from 'react';
import Animated, { SlideInDown, SlideOutDown } from 'react-native-reanimated';

import { useFormatters } from '@suite-common/formatters';
import { type YieldApprovalAction } from '@suite-common/wallet-core';
import { type TokenSymbol } from '@suite-common/wallet-types';
import { calculateRewards } from '@suite-common/wallet-utils';
import { Box, Button, ScreenFooterGradient, Text, VStack } from '@suite-native/atoms';
import { Translation, type TxKeyPath, useTranslate } from '@suite-native/intl';
import { prepareNativeStyle, useNativeStyles } from '@trezor/styles-native';

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
    onPress: () => void;
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
    onPress,
    shouldKeepEstimatedRewardsVisible = false,
    tokenSymbol,
}: YieldDepositFlowFooterProps) => {
    const { applyStyle } = useNativeStyles();
    const { translate } = useTranslate();
    const { CryptoAmountFormatter } = useFormatters();

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

    const buttonTranslationId = getSubmitButtonTranslationId(approvalAction);
    const isApprovalLimitAction = approvalAction === 'increase' || approvalAction === 'revoke';
    const isEstimatedRewardsVisible =
        (shouldKeepEstimatedRewardsVisible || (!isApprovalLimitAction && !isDisabled)) &&
        estimatedRewards !== null;

    return (
        <Animated.View entering={SlideInDown} exiting={SlideOutDown}>
            <ScreenFooterGradient />
            <Box style={applyStyle(screenFooterStyle)}>
                <Box style={isEstimatedRewardsVisible ? applyStyle(rewardsBoxStyle) : undefined}>
                    {isEstimatedRewardsVisible && (
                        <VStack spacing="sp4" paddingVertical="sp12" alignItems="center">
                            <Text variant="body-sm" color="contentPrimary">
                                <Translation id="earn.yieldDepositFlowScreen.estimatedRewardsLabel" />
                            </Text>
                            <Text variant="headline-sm" color="contentBrand">
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
            </Box>
        </Animated.View>
    );
};
