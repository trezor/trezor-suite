import Animated, { SlideInDown, SlideOutDown } from 'react-native-reanimated';

import { type YieldApprovalAction } from '@suite-common/wallet-core';
import { Box, Button, ScreenFooterGradient, VStack } from '@suite-native/atoms';
import { Translation, type TxKeyPath, useTranslate } from '@suite-native/intl';
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
    /** For a wrapped-native vault this is the native symbol the user thinks in, e.g. ETH. */
    tokenSymbol: string;
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

    const buttonTranslationId = getSubmitButtonTranslationId(approvalAction);
    const isApprovalLimitAction = approvalAction === 'increase' || approvalAction === 'revoke';
    const isEstimatedRewardsVisible =
        (shouldKeepEstimatedRewardsVisible || (!isApprovalLimitAction && !isDisabled)) &&
        !!amountValue &&
        apy !== null;

    return (
        <Animated.View entering={SlideInDown} exiting={SlideOutDown}>
            <ScreenFooterGradient />
            <Box style={applyStyle(screenFooterStyle)}>
                <VStack spacing="sp12">
                    <Box
                        style={isEstimatedRewardsVisible ? applyStyle(rewardsBoxStyle) : undefined}
                    >
                        {isEstimatedRewardsVisible && (
                            <Box paddingVertical="sp12">
                                <EarnEstimatedRewards
                                    amountValue={amountValue}
                                    apy={apy}
                                    label={
                                        <Translation id="earn.yieldDepositFlowScreen.estimatedRewardsLabel" />
                                    }
                                    symbol={tokenSymbol}
                                />
                            </Box>
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
