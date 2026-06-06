import { useCallback } from 'react';
import { useSelector } from 'react-redux';

import { type RouteProp, useIsFocused, useRoute } from '@react-navigation/native';

import { getNetwork } from '@suite-common/wallet-config';
import { type AccountsRootState, selectAccountByKey } from '@suite-common/wallet-core';
import { Box, FullAlertBox, Text, VStack } from '@suite-native/atoms';
import { useFiatFromCryptoValue } from '@suite-native/formatters';
import { Translation } from '@suite-native/intl';
import {
    Screen,
    ScreenHeader,
    type YieldStackParamList,
    type YieldStackRoutes,
} from '@suite-native/navigation';
import { FeeSelector } from '@suite-native/transaction-management';

import { YieldClaimFlowFooter } from '../components/YieldClaimFlowFooter';
import { YieldClaimRewardsCard } from '../components/YieldClaimRewardsCard';
import { useShowYieldTransactionFailureAlert } from '../hooks/useShowYieldTransactionFailureAlert';
import { useYieldClaimFees } from '../hooks/useYieldClaimFees';
import { useYieldClaimRewards } from '../hooks/useYieldClaimRewards';
import { useYieldSession } from '../hooks/useYieldSession';
import { shouldShowClaimFeeWarning } from '../utils/yieldClaimFeeWarningUtils';

type RouteProps = RouteProp<YieldStackParamList, YieldStackRoutes.YieldClaim>;

export const YieldClaimScreen = () => {
    const route = useRoute<RouteProps>();
    const { accountKey } = route.params;
    const isFocused = useIsFocused();
    const account = useSelector((state: AccountsRootState) =>
        selectAccountByKey(state, accountKey),
    );
    const flowKey = account?.key ?? null;
    const session = useYieldSession({
        flowKey,
        flowType: 'claim',
    });
    const { accountRewards, isClaimRewardsFiatLoading, isClaimRewardsLoading } =
        useYieldClaimRewards({ account });
    const isClaimPending = !!session?.action.pendingTransaction;
    const isClaimSubmitting = session?.action.isSubmitting ?? false;
    const claimFee = useYieldClaimFees({
        accountRewards,
        isEnabled: !!account && !isClaimPending,
    });
    const feeFiatAmount = useFiatFromCryptoValue({
        cryptoValue: claimFee.feePreview?.fee ?? null,
        symbol: account?.symbol ?? 'eth',
        isBalance: false,
    });
    const totalFiatClaimableAmount = accountRewards?.totalFiatClaimableAmount ?? null;
    const shouldShowFeeWarning = shouldShowClaimFeeWarning({
        feeFiatAmount,
        totalFiatClaimableAmount,
    });
    const isContinueDisabled =
        isClaimPending ||
        isClaimSubmitting ||
        isClaimRewardsLoading ||
        claimFee.isPreparingClaimFee ||
        claimFee.isFeeUnavailable ||
        !accountRewards ||
        !claimFee.preparedAction;

    useShowYieldTransactionFailureAlert({
        error: session?.error,
        flowKey,
        flowType: 'claim',
        isEnabled: isFocused,
    });

    const handleContinue = useCallback(() => {
        if (isContinueDisabled) {
            return;
        }

        // TODO: Open Stablecoin Yield claim transaction simulation in the next claim task.
    }, [isContinueDisabled]);

    if (!account) {
        return null;
    }

    const accountLabel = account.accountLabel ?? getNetwork(account.symbol).name;

    return (
        <Screen
            noHorizontalPadding
            header={
                <ScreenHeader
                    customContent={
                        <VStack spacing={0} alignItems="center">
                            <Text variant="body-md-strong">
                                <Translation id="earn.yieldClaimFlowScreen.title" />
                            </Text>
                            <Text
                                variant="body-md"
                                color="contentSecondary"
                                numberOfLines={1}
                                ellipsizeMode="tail"
                            >
                                {accountLabel}
                            </Text>
                        </VStack>
                    }
                />
            }
            footer={
                <YieldClaimFlowFooter
                    isDisabled={isContinueDisabled}
                    isLoading={isClaimSubmitting}
                    onPress={handleContinue}
                />
            }
        >
            <Box paddingHorizontal="sp16">
                <VStack spacing="sp20">
                    <YieldClaimRewardsCard
                        accountRewards={accountRewards}
                        isFiatLoading={isClaimRewardsFiatLoading}
                        isLoading={isClaimRewardsLoading}
                    />

                    <FeeSelector
                        accountKey={account.key}
                        updateThunk={claimFee.updateFeeLevelThunk}
                        selectedFee={claimFee.selectedFee}
                        selectedFeePerUnit={claimFee.formDraft?.feePerUnit}
                        formDraft={claimFee.formDraft}
                        formDraftKey={claimFee.formDraftKey}
                    />

                    {shouldShowFeeWarning && (
                        <FullAlertBox
                            variant="warning"
                            title={<Translation id="earn.yieldClaimFlowScreen.feeWarning.title" />}
                            description={
                                <Translation id="earn.yieldClaimFlowScreen.feeWarning.description" />
                            }
                        />
                    )}
                </VStack>
            </Box>
        </Screen>
    );
};
