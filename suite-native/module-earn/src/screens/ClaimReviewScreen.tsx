import { useMemo } from 'react';
import { useSelector } from 'react-redux';

import { type RouteProp, useNavigation, useRoute } from '@react-navigation/native';

import { useServices } from '@suite-common/dependency-injection';
import { buildClaimWithdrawRequestData, getStakingContractAddress } from '@suite-common/staking';
import { getNetworkDisplaySymbol } from '@suite-common/wallet-config';
import { type AccountsRootState, selectAccountByKey } from '@suite-common/wallet-core';
import {
    asAmountSubunit,
    getStakingLimitsByNetworkSymbol,
    isSupportedEthStakingNetworkSymbol,
    isSupportedSolStakingNetworkSymbol,
    subunitsToUnits,
} from '@suite-common/wallet-utils';
import { AccountDetailsCard } from '@suite-native/accounts';
import { events, selectNativeAnalyticsDep } from '@suite-native/analytics';
import { Box, Button, FullAlertBox, InlineAlertBox, Text, VStack } from '@suite-native/atoms';
import { Translation } from '@suite-native/intl';
import {
    type RootStackParamList,
    RootStackRoutes,
    Screen,
    ScreenHeader,
    type StackNavigationProps,
} from '@suite-native/navigation';
import {
    type NativeStakingRootState,
    selectCanClaimByAccountKey,
    selectClaimableAmountByAccountKey,
} from '@suite-native/staking';
import { FeeSelector } from '@suite-native/transaction-management';
import { MAX_DEACTIVATE_ACCOUNTS_WITH_SPLIT } from '@trezor/coins-solana/constants';
import { BigNumber } from '@trezor/utils';

import { useComposeEarnFees } from '../hooks/useComposeEarnFees';
import { useNavigateBackAnalytics } from '../hooks/useNavigateBackAnalytics';
import { useSolanaStakingLimit } from '../hooks/useSolanaStakingLimit';
import { buildEarnComposeFormState } from '../utils';

export const ClaimReviewScreen = () => {
    const route = useRoute<RouteProp<RootStackParamList, RootStackRoutes.ClaimReview>>();
    const navigation =
        useNavigation<StackNavigationProps<RootStackParamList, RootStackRoutes.ClaimReview>>();
    const { accountKey, symbol } = route.params;
    const displaySymbol = getNetworkDisplaySymbol(symbol);

    const canClaimInstantly = useSelector((state: NativeStakingRootState) =>
        selectCanClaimByAccountKey(state, accountKey),
    );
    const claimableAmount = useSelector((state: NativeStakingRootState) =>
        selectClaimableAmountByAccountKey(state, accountKey),
    );
    const account = useSelector((state: AccountsRootState) =>
        selectAccountByKey(state, accountKey),
    );
    const availableBalance = account?.availableBalance ?? '0';

    const feeBuffer = getStakingLimitsByNetworkSymbol(symbol)?.MIN_BALANCE_FOR_FEE_BUFFER;
    const availableBalanceInUnits = subunitsToUnits({
        value: asAmountSubunit(new BigNumber(availableBalance)),
        symbol,
    });
    const isInsufficientFeeBalance = !!feeBuffer && availableBalanceInUnits.lt(feeBuffer);
    const formattedAvailableBalance = `${availableBalanceInUnits.toString()} ${displaySymbol}`;

    const claimFormState = useMemo(() => {
        if (!account) return undefined;

        const contractAddress = getStakingContractAddress(account, 'claim');

        // Ethereum claims via calldata, Solana via the claimable amount.
        if (account.networkType === 'ethereum') {
            return buildEarnComposeFormState(contractAddress, '0', buildClaimWithdrawRequestData());
        }

        if (account.networkType === 'solana') {
            return buildEarnComposeFormState(contractAddress, claimableAmount ?? '0', '');
        }

        return buildEarnComposeFormState(contractAddress, '0', '');
    }, [account, claimableAmount]);

    const { formDraft, formDraftKey, isFeeUnavailable, isPrecomposeError, updateFeeLevelThunk } =
        useComposeEarnFees({
            accountKey,
            formState: claimFormState,
            formDraftPrefix: 'claim',
        });

    const { isLimitExceeded: isAccountLimitExceeded, formattedAmount: claimableLimitAmount } =
        useSolanaStakingLimit({ accountKey, type: 'claim', amount: claimableAmount });

    const { analytics } = useServices(selectNativeAnalyticsDep);
    const registerNavigateBackAnalytics = useNavigateBackAnalytics({
        type: events.stakingClaimEvent.name,
        payload: {
            action: 'cancel',
            step: 'claim-form-modal',
            networkSymbol: symbol,
        },
    });

    const handleReviewAndSign = () => {
        registerNavigateBackAnalytics();
        analytics.report({
            type: events.stakingClaimEvent.name,
            payload: {
                action: 'continue',
                step: 'claim-form-modal',
                networkSymbol: symbol,
            },
        });
        navigation.navigate(RootStackRoutes.ClaimTransactionDataReview, { accountKey });
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
                                values={{ displaySymbol }}
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
                            !claimFormState ||
                            isInsufficientFeeBalance ||
                            isFeeUnavailable ||
                            isPrecomposeError ||
                            !(
                                isSupportedEthStakingNetworkSymbol(symbol) ||
                                isSupportedSolStakingNetworkSymbol(symbol)
                            )
                        }
                    >
                        <Translation id="earn.claimReviewScreen.reviewAndSignButton" />
                    </Button>
                </Box>
            }
        >
            <VStack spacing="sp16">
                <AccountDetailsCard
                    accountKey={accountKey}
                    isStakeVariant={true}
                    titleLabel={<Translation id="earn.claimReviewScreen.amountLabel" />}
                    cryptoAmount={claimableAmount}
                />
                <FeeSelector
                    accountKey={accountKey}
                    updateThunk={updateFeeLevelThunk}
                    selectedFee={formDraft?.selectedFee ?? 'normal'}
                    selectedFeePerUnit={formDraft?.feePerUnit}
                    formDraft={formDraft}
                    formDraftKey={formDraftKey}
                />
                {isInsufficientFeeBalance && (
                    <FullAlertBox
                        intent="critical"
                        iconName="warningCircle"
                        title={
                            <Translation
                                id="earn.claimReviewScreen.insufficientFeeBalance.title"
                                values={{ displaySymbol }}
                            />
                        }
                        description={
                            <Translation
                                id="earn.claimReviewScreen.insufficientFeeBalance.description"
                                values={{ amount: formattedAvailableBalance }}
                            />
                        }
                    />
                )}
                {canClaimInstantly && !isInsufficientFeeBalance && (
                    <InlineAlertBox
                        intent="brand"
                        title={
                            <Translation
                                id="earn.claimReviewScreen.instantClaimBanner"
                                values={{ displaySymbol }}
                            />
                        }
                    />
                )}
                {isAccountLimitExceeded && (
                    <InlineAlertBox
                        intent="info"
                        title={
                            <Translation
                                id="earn.claimReviewScreen.accountLimitBanner"
                                values={{
                                    limit: MAX_DEACTIVATE_ACCOUNTS_WITH_SPLIT,
                                    amount: claimableLimitAmount,
                                    symbol: displaySymbol,
                                }}
                            />
                        }
                    />
                )}
            </VStack>
        </Screen>
    );
};
