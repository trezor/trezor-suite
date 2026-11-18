import { useMemo } from 'react';
import { useSelector } from 'react-redux';

import { type RouteProp, useNavigation, useRoute } from '@react-navigation/native';

import {
    formatStakingAmount,
    isStakingOperationAvailable,
    useStakingAccountPosition,
} from '@suite-common/earn-staking';
import {
    type AccountsRootState,
    buildClaimWithdrawRequestData,
    getStakingContractAddress,
    selectAccountByKey,
} from '@suite-common/wallet-core';
import { isPositiveBalance } from '@suite-common/wallet-utils';
import { events, injectNativeAnalytics } from '@suite-native/analytics';
import { AssetSymbol } from '@suite-native/assets';
import { BannerInline, Box, Button, Text, VStack } from '@suite-native/atoms';
import { Translation } from '@suite-native/intl';
import {
    type RootStackParamList,
    RootStackRoutes,
    Screen,
    ScreenHeader,
    type StackNavigationProps,
} from '@suite-native/navigation';
import { useServices } from '@trezor/dependency-injection';
import { MAX_DEACTIVATE_ACCOUNTS_WITH_SPLIT } from '@trezor/network-solana/constants';

import { EarnAmountCard } from '../../components/earn/EarnAmountCard';
import { EarnFeeSection } from '../../components/earn/EarnFeeSection';
import { StakingPendingTransactionModal } from '../../components/staking/StakingPendingTransactionModal';
import { useComposeEarnFees } from '../../hooks/earn/useComposeEarnFees';
import { useEarnDeviceStatus } from '../../hooks/earn/useEarnDeviceStatus';
import { useNavigateBackAnalytics } from '../../hooks/earn/useNavigateBackAnalytics';
import { useSolanaStakingLimit } from '../../hooks/staking/useSolanaStakingLimit';
import { useStakingPendingTransaction } from '../../hooks/staking/useStakingPendingTransaction';
import { buildEarnComposeFormState } from '../../utils/earn/utils';

export const StakingClaimReviewScreen = () => {
    const route = useRoute<RouteProp<RootStackParamList, RootStackRoutes.StakingClaimReview>>();
    const navigation =
        useNavigation<
            StackNavigationProps<RootStackParamList, RootStackRoutes.StakingClaimReview>
        >();
    const { accountKey, symbol, pendingTransaction } = route.params;

    const { isPending, pendingModal } = useStakingPendingTransaction({
        accountKey,
        pendingTransaction,
        stakeType: 'claim',
    });

    const account = useSelector((state: AccountsRootState) =>
        selectAccountByKey(state, accountKey),
    );
    const { position, totals, access } = useStakingAccountPosition(accountKey);

    const canClaimInstantly = isStakingOperationAvailable({
        position,
        access,
        operation: 'withdraw',
    });
    const claimableAmount = formatStakingAmount({
        amount: totals.withdrawable,
        networkSymbol: symbol,
    });
    const hasNoClaimableSolanaStake =
        account?.networkType === 'solana' && !isPositiveBalance(claimableAmount);

    const claimFormState = useMemo(() => {
        if (!account) return undefined;

        const contractAddress = getStakingContractAddress(account, 'claim');

        // Ethereum claims via calldata, Solana via the claimable amount.
        if (account.networkType === 'ethereum') {
            return buildEarnComposeFormState(contractAddress, '0', buildClaimWithdrawRequestData());
        }

        if (account.networkType === 'solana') {
            if (!isPositiveBalance(claimableAmount)) return undefined;

            return buildEarnComposeFormState(contractAddress, claimableAmount, '');
        }

        return buildEarnComposeFormState(contractAddress, '0', '');
    }, [account, claimableAmount]);

    const {
        formDraft,
        formDraftKey,
        hasFeeEstimationError,
        isComposingFeeLevels,
        retryFeeEstimation,
        isFeeReady,
        updateFeeLevelThunk,
    } = useComposeEarnFees({
        accountKey,
        formState: claimFormState,
        formDraftPrefix: 'claim',
    });

    const { isLimitExceeded: isAccountLimitExceeded, formattedAmount: claimableLimitAmount } =
        useSolanaStakingLimit({ accountKey, type: 'claim', amount: claimableAmount });

    const { analytics } = useServices(injectNativeAnalytics);
    const deviceStatus = useEarnDeviceStatus();
    const registerNavigateBackAnalytics = useNavigateBackAnalytics(
        {
            type: events.stakingClaimEvent.name,
            payload: {
                action: 'cancel',
                step: 'claim-form-modal',
                networkSymbol: symbol,
            },
        },
        !isPending,
    );

    const handleReviewAndSign = () => {
        registerNavigateBackAnalytics();

        analytics.report({
            type: events.stakingClaimEvent.name,
            payload: {
                action: 'continue',
                deviceStatus,
                step: 'claim-form-modal',
                networkSymbol: symbol,
            },
        });

        navigation.navigate(RootStackRoutes.StakingTransactionDataReview, {
            stakeType: 'claim',
            accountKey,
        });
    };

    return (
        <Screen
            header={
                <ScreenHeader
                    closeActionType="back"
                    customContent={
                        <Text variant="body-md-strong">
                            <Translation
                                id="earn.claimReviewScreen.title"
                                values={{
                                    displaySymbol: (
                                        <AssetSymbol
                                            networkSymbol={symbol}
                                            variant="body-md-strong"
                                        />
                                    ),
                                }}
                            />
                        </Text>
                    }
                />
            }
            footer={
                <Box paddingHorizontal="sp16" paddingBottom="sp16">
                    <Button
                        onPress={handleReviewAndSign}
                        isDisabled={
                            isPending || !claimFormState || !canClaimInstantly || !isFeeReady
                        }
                    >
                        <Translation id="earn.claimReviewScreen.reviewAndSignButton" />
                    </Button>
                </Box>
            }
        >
            {/* Keep the native parent stable when pointerEvents changes during navigation. */}
            <Box collapsable={false} pointerEvents={isPending ? 'none' : 'auto'}>
                <VStack spacing="sp16">
                    <EarnAmountCard
                        accountKey={accountKey}
                        label={<Translation id="earn.claimReviewScreen.amountLabel" />}
                        cryptoAmount={claimableAmount}
                    />
                    {hasNoClaimableSolanaStake && (
                        <BannerInline
                            intent="info"
                            title={
                                <Translation id="transactionManagement.precomposedTransaction.errors.solanaStakingNothingToClaim" />
                            }
                        />
                    )}
                    {!hasNoClaimableSolanaStake && (
                        <EarnFeeSection
                            accountKey={accountKey}
                            fees={{
                                hasFeeEstimationError,
                                isComposingFeeLevels,
                                retryFeeEstimation,
                                updateFeeLevelThunk,
                                selectedFee: formDraft?.selectedFee ?? 'normal',
                                formDraft,
                                formDraftKey,
                            }}
                        />
                    )}
                    {canClaimInstantly && isFeeReady && (
                        <BannerInline
                            intent="brand"
                            title={
                                <Translation
                                    id="earn.claimReviewScreen.instantClaimBanner"
                                    values={{
                                        displaySymbol: (
                                            <AssetSymbol
                                                networkSymbol={symbol}
                                                variant="body-sm"
                                                color="contentBrand"
                                            />
                                        ),
                                    }}
                                />
                            }
                        />
                    )}
                    {isAccountLimitExceeded && (
                        <BannerInline
                            intent="info"
                            title={
                                <Translation
                                    id="earn.claimReviewScreen.accountLimitBanner"
                                    values={{
                                        limit: MAX_DEACTIVATE_ACCOUNTS_WITH_SPLIT,
                                        amount: claimableLimitAmount,
                                        symbol: (
                                            <AssetSymbol
                                                networkSymbol={symbol}
                                                variant="body-sm"
                                                color="contentInfo"
                                            />
                                        ),
                                    }}
                                />
                            }
                        />
                    )}
                </VStack>
            </Box>

            <StakingPendingTransactionModal
                accountKey={accountKey}
                pendingModal={pendingModal}
                stakeType="claim"
            />
        </Screen>
    );
};
