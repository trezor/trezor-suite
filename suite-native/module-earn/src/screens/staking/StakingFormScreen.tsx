import { useCallback, useRef } from 'react';
import { useSelector } from 'react-redux';

import { type RouteProp, useNavigation, useRoute } from '@react-navigation/native';

import { useServices } from '@suite-common/dependency-injection';
import { getNetworkDisplaySymbolName } from '@suite-common/wallet-config';
import {
    type AccountsRootState,
    type EarnOnboardingRootState,
    getEarnOpportunityKey,
    selectAccountNetworkSymbol,
    selectIsEarnOnboardingConfirmed,
} from '@suite-common/wallet-core';
import { events, injectNativeAnalytics } from '@suite-native/analytics';
import { type ActiveView, Box } from '@suite-native/atoms';
import { Form } from '@suite-native/forms';
import { Translation } from '@suite-native/intl';
import {
    type RootStackParamList,
    RootStackRoutes,
    Screen,
    ScreenHeader,
    type StackNavigationProps,
} from '@suite-native/navigation';
import { FeeSelector } from '@suite-native/transaction-management';

import { EarnAmountCard } from '../../components/earn/EarnAmountCard';
import { EarnOutputFields } from '../../components/earn/EarnOutputFields';
import { StakingFormScreenFooter } from '../../components/staking/StakingFormScreenFooter';
import { StakingNoBalanceContent } from '../../components/staking/StakingNoBalanceContent';
import { useNavigateBackAnalytics } from '../../hooks/earn/useNavigateBackAnalytics';
import { useStakingForm } from '../../hooks/staking/useStakingForm';
import { isBalanceBelowStakingMinimum } from '../../utils/staking/isBalanceBelowStakingMinimum';

export const StakingFormScreen = () => {
    const route = useRoute<RouteProp<RootStackParamList, RootStackRoutes.StakingForm>>();
    const { accountKey } = route.params;
    const navigation =
        useNavigation<StackNavigationProps<RootStackParamList, RootStackRoutes.StakingForm>>();

    const stakingForm = useStakingForm(accountKey);
    const isOnboardingConfirmed = useSelector((state: EarnOnboardingRootState) =>
        selectIsEarnOnboardingConfirmed(
            state,
            accountKey,
            getEarnOpportunityKey({ type: 'staking', provider: 'everstake' }),
        ),
    );
    const networkSymbol = useSelector((state: AccountsRootState) =>
        selectAccountNetworkSymbol(state, accountKey),
    );
    const { analytics } = useServices(injectNativeAnalytics);
    const currencyRef = useRef<'crypto' | 'fiat' | undefined>(undefined);
    const handleCurrencyChange = useCallback((activeView: ActiveView) => {
        currencyRef.current = activeView === 'primary' ? 'crypto' : 'fiat';
    }, []);
    const registerNavigateBackAnalytics = useNavigateBackAnalytics({
        type: events.stakingStakeEvent.name,
        payload: {
            action: 'cancel',
            step: 'stake-form-modal',
            networkSymbol: networkSymbol ?? undefined,
            currency: currencyRef.current,
        },
    });

    if (!stakingForm) {
        return null;
    }

    const {
        form,
        amountValue,
        account,
        formDraft,
        formDraftKey,
        isFeeUnavailable,
        isPrecomposeError,
        updateFeeLevelThunk,
    } = stakingForm;
    const {
        formState: { isValid },
    } = form;

    if (isBalanceBelowStakingMinimum(account)) {
        return <StakingNoBalanceContent accountKey={accountKey} />;
    }

    const handleSubmit = form.handleSubmit(() => {
        registerNavigateBackAnalytics();
        analytics.report({
            type: events.stakingStakeEvent.name,
            payload: {
                action: 'continue',
                step: 'stake-form-modal',
                networkSymbol: account.symbol,
                currency: currencyRef.current,
            },
        });
        if (isOnboardingConfirmed) {
            navigation.navigate(RootStackRoutes.StakingTransactionDataReview, {
                stakeType: 'stake',
                accountKey,
                amount: amountValue,
            });

            return;
        }
        navigation.navigate(RootStackRoutes.EarnConsents, {
            accountKey,
            amount: amountValue,
            account,
        });
    });

    return (
        <Screen
            header={
                <ScreenHeader
                    title={
                        <Translation
                            id="earn.earnFormScreen.title"
                            values={{ assetName: getNetworkDisplaySymbolName(account.symbol) }}
                        />
                    }
                />
            }
            footer={
                <StakingFormScreenFooter
                    symbol={account.symbol}
                    amountValue={amountValue}
                    isDisabled={!isValid || isFeeUnavailable || isPrecomposeError}
                    onPress={() => handleSubmit()}
                />
            }
        >
            <EarnAmountCard accountKey={accountKey} />
            <Box marginTop="sp16">
                <Form form={form}>
                    <EarnOutputFields
                        accountKey={accountKey}
                        onCurrencyChange={handleCurrencyChange}
                    />
                </Form>
            </Box>
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
