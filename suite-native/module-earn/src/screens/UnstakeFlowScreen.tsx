import { useCallback, useRef } from 'react';
import { useSelector } from 'react-redux';

import { type RouteProp, useNavigation, useRoute } from '@react-navigation/native';

import { useServices } from '@suite-common/dependency-injection';
import { getNetworkDisplaySymbol } from '@suite-common/wallet-config';
import { type AccountsRootState, selectAccountNetworkSymbol } from '@suite-common/wallet-core';
import { AccountDetailsCard } from '@suite-native/accounts';
import { events, selectNativeAnalyticsDep } from '@suite-native/analytics';
import {
    type ActiveView,
    Box,
    Button,
    InlineAlertBox,
    ScreenFooterGradient,
} from '@suite-native/atoms';
import { Form } from '@suite-native/forms';
import { Translation } from '@suite-native/intl';
import {
    type RootStackParamList,
    RootStackRoutes,
    Screen,
    type StackNavigationProps,
} from '@suite-native/navigation';
import { FeeSelector } from '@suite-native/transaction-management';
import { MAX_DEACTIVATE_ACCOUNTS_WITH_SPLIT } from '@trezor/network-solana/constants';

import { EarnOutputFields } from '../components/EarnOutputFields';
import { SolanaUnstakeAmountBoundsAlert } from '../components/SolanaUnstakeAmountBoundsAlert';
import { UnstakeCanClaimAlert } from '../components/UnstakeCanClaimAlert';
import { UnstakeFlowScreenHeader } from '../components/UnstakeFlowScreenHeader';
import { UnstakingTimelineCard } from '../components/UnstakingTimelineCard';
import { useNavigateBackAnalytics } from '../hooks/useNavigateBackAnalytics';
import { useSolanaStakingLimit } from '../hooks/useSolanaStakingLimit';
import { useUnstakeForm } from '../hooks/useUnstakeForm';

export const UnstakeFlowScreen = () => {
    const route = useRoute<RouteProp<RootStackParamList, RootStackRoutes.UnstakeFlow>>();
    const { accountKey } = route.params;
    const navigation =
        useNavigation<StackNavigationProps<RootStackParamList, RootStackRoutes.UnstakeFlow>>();

    const unstakeForm = useUnstakeForm(accountKey);
    const networkSymbol = useSelector((state: AccountsRootState) =>
        selectAccountNetworkSymbol(state, accountKey),
    );
    const { analytics } = useServices(selectNativeAnalyticsDep);
    const currencyRef = useRef<'crypto' | 'fiat' | undefined>(undefined);
    const handleCurrencyChange = useCallback((activeView: ActiveView) => {
        currencyRef.current = activeView === 'primary' ? 'crypto' : 'fiat';
    }, []);
    const registerNavigateBackAnalytics = useNavigateBackAnalytics({
        type: events.stakingUnstakeEvent.name,
        payload: {
            action: 'cancel',
            step: 'unstake-form-modal',
            networkSymbol: networkSymbol ?? undefined,
            currency: currencyRef.current,
        },
    });

    const { isLimitExceeded: isAccountLimitExceeded, formattedAmount: unstakeLimitAmount } =
        useSolanaStakingLimit({
            accountKey,
            type: 'unstake',
            amount: unstakeForm?.amountValue,
        });

    if (!unstakeForm) return null;

    const {
        form,
        account,
        amountValue,
        stakedBalance,
        canClaim,
        claimableAmount,
        showNetworkFeeWarning,
        formDraft,
        formDraftKey,
        isFeeUnavailable,
        isPrecomposeError,
        updateFeeLevelThunk,
        approximatedInstantEthAmount,
    } = unstakeForm;

    const {
        formState: { isValid },
    } = form;

    const handleReviewAndSign = form.handleSubmit(() => {
        registerNavigateBackAnalytics();
        analytics.report({
            type: events.stakingUnstakeEvent.name,
            payload: {
                action: 'continue',
                step: 'unstake-form-modal',
                networkSymbol: networkSymbol ?? undefined,
                currency: currencyRef.current,
            },
        });
        navigation.navigate(RootStackRoutes.UnstakeTransactionDataReview, {
            accountKey,
            amount: amountValue,
        });
    });

    return (
        <Screen
            header={<UnstakeFlowScreenHeader />}
            footer={
                <>
                    <ScreenFooterGradient />
                    <Box paddingHorizontal="sp16" paddingBottom="sp16">
                        <Button
                            isDisabled={!isValid || isFeeUnavailable || isPrecomposeError}
                            onPress={handleReviewAndSign}
                        >
                            <Translation id="earn.earnFormScreen.reviewAndSign" />
                        </Button>
                    </Box>
                </>
            }
        >
            <AccountDetailsCard
                accountKey={accountKey}
                isStakeVariant
                titleLabel={<Translation id="earn.earnFormScreen.staked" />}
                cryptoAmount={stakedBalance ?? undefined}
            />

            {isAccountLimitExceeded && networkSymbol && (
                <Box marginTop="sp16">
                    <InlineAlertBox
                        intent="info"
                        title={
                            <Translation
                                id="earn.unstakeFlowScreen.accountLimitBanner"
                                values={{
                                    limit: MAX_DEACTIVATE_ACCOUNTS_WITH_SPLIT,
                                    amount: unstakeLimitAmount,
                                    symbol: getNetworkDisplaySymbol(networkSymbol),
                                }}
                            />
                        }
                    />
                </Box>
            )}

            <Box marginTop="sp16">
                <UnstakingTimelineCard accountKey={accountKey} />
            </Box>

            <Form form={form}>
                <Box marginTop="sp16">
                    <EarnOutputFields
                        accountKey={accountKey}
                        maxButtonVariant="unstake"
                        isWithdrawalFeesBannerVisible={false}
                        unstakeInstantAmount={approximatedInstantEthAmount}
                        onCurrencyChange={handleCurrencyChange}
                    />
                </Box>
                <Box marginTop="sp16">
                    <SolanaUnstakeAmountBoundsAlert account={account} amountValue={amountValue} />
                </Box>
            </Form>
            {showNetworkFeeWarning && (
                <Box marginTop="sp16">
                    <InlineAlertBox
                        intent="warning"
                        title={<Translation id="earn.earnFormScreen.networkFeeWarning" />}
                    />
                </Box>
            )}
            {canClaim && networkSymbol && (
                <Box marginTop="sp16">
                    <UnstakeCanClaimAlert
                        claimableAmount={claimableAmount}
                        symbol={networkSymbol}
                    />
                </Box>
            )}
            {isValid && (
                <Box marginTop="sp24">
                    <FeeSelector
                        accountKey={accountKey}
                        updateThunk={updateFeeLevelThunk}
                        selectedFee={formDraft?.selectedFee ?? 'normal'}
                        selectedFeePerUnit={formDraft?.feePerUnit}
                        formDraft={formDraft}
                        formDraftKey={formDraftKey}
                    />
                </Box>
            )}
        </Screen>
    );
};
