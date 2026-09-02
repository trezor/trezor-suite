import { useCallback, useRef } from 'react';
import { useSelector } from 'react-redux';

import { type RouteProp, useNavigation, useRoute } from '@react-navigation/native';

import { useServices } from '@suite-common/dependency-injection';
import { type AccountsRootState, selectAccountNetworkSymbol } from '@suite-common/wallet-core';
import { events, selectNativeAnalyticsDep } from '@suite-native/analytics';
import { type ActiveView, Box } from '@suite-native/atoms';
import { Form } from '@suite-native/forms';
import {
    type RootStackParamList,
    RootStackRoutes,
    Screen,
    type StackNavigationProps,
} from '@suite-native/navigation';
import { FeeSelector } from '@suite-native/transaction-management';

import { EarnAmountCard } from '../../components/earn/EarnAmountCard';
import { EarnFormScreenFooter } from '../../components/earn/EarnFormScreenFooter';
import { EarnFormScreenHeader } from '../../components/earn/EarnFormScreenHeader';
import { EarnInsufficientBalanceBanner } from '../../components/earn/EarnInsufficientBalanceBanner';
import { EarnOutputFields } from '../../components/earn/EarnOutputFields';
import { useEarnForm } from '../../hooks/earn/useEarnForm';
import { useNavigateBackAnalytics } from '../../hooks/earn/useNavigateBackAnalytics';

export const EarnFormScreen = () => {
    const route = useRoute<RouteProp<RootStackParamList, RootStackRoutes.EarnForm>>();
    const { accountKey } = route.params;
    const navigation =
        useNavigation<StackNavigationProps<RootStackParamList, RootStackRoutes.EarnForm>>();

    const earnForm = useEarnForm(accountKey);
    const networkSymbol = useSelector((state: AccountsRootState) =>
        selectAccountNetworkSymbol(state, accountKey),
    );
    const { analytics } = useServices(selectNativeAnalyticsDep);
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

    if (!earnForm) {
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
    } = earnForm;
    const {
        formState: { isValid },
    } = form;

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
        navigation.navigate(RootStackRoutes.EarnConsents, {
            accountKey,
            amount: amountValue,
            account,
        });
    });

    return (
        <Screen
            header={<EarnFormScreenHeader accountKey={accountKey} />}
            footer={
                <EarnFormScreenFooter
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
            <EarnInsufficientBalanceBanner accountKey={accountKey} />
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
