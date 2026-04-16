import { type RouteProp, useNavigation, useRoute } from '@react-navigation/native';

import { AccountDetailsCard } from '@suite-native/accounts';
import { Box, Button, InlineAlertBox, ScreenFooterGradient } from '@suite-native/atoms';
import { Form } from '@suite-native/forms';
import { Translation } from '@suite-native/intl';
import {
    type RootStackParamList,
    RootStackRoutes,
    Screen,
    type StackNavigationProps,
} from '@suite-native/navigation';
import { FeeSelector } from '@suite-native/transaction-management';

import { EarnOutputFields } from '../components/EarnOutputFields';
import { UnstakeFlowScreenHeader } from '../components/UnstakeFlowScreenHeader';
import { UnstakingTimelineCard } from '../components/UnstakingTimelineCard';
import { useUnstakeForm } from '../hooks/useUnstakeForm';

export const UnstakeFlowScreen = () => {
    const route = useRoute<RouteProp<RootStackParamList, RootStackRoutes.UnstakeFlow>>();
    const { accountKey } = route.params;
    const navigation =
        useNavigation<StackNavigationProps<RootStackParamList, RootStackRoutes.UnstakeFlow>>();

    const unstakeForm = useUnstakeForm(accountKey);

    if (!unstakeForm) return null;

    const {
        form,
        amountValue,
        stakedBalance,
        showNetworkFeeWarning,
        formDraft,
        formDraftKey,
        updateFeeLevelThunk,
    } = unstakeForm;
    const {
        formState: { isValid },
    } = form;

    const handleReviewAndSign = form.handleSubmit(() => {
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
                        <Button isDisabled={!isValid} onPress={handleReviewAndSign}>
                            <Translation id="earn.earnFormScreen.reviewAndSign" />
                        </Button>
                    </Box>
                </>
            }
        >
            <AccountDetailsCard
                accountKey={accountKey}
                isStakeVariant
                titleLabel={<Translation id="earn.earnFormScreen.availableBalance" />}
                cryptoAmount={stakedBalance ?? undefined}
            />

            <Box marginTop="sp16">
                <UnstakingTimelineCard accountKey={accountKey} />
            </Box>

            <Box marginTop="sp16">
                <Form form={form}>
                    <EarnOutputFields
                        accountKey={accountKey}
                        maxButtonVariant="unstake"
                        isWithdrawalFeesBannerVisible={false}
                    />
                </Form>
            </Box>
            {showNetworkFeeWarning && (
                <Box marginTop="sp16">
                    <InlineAlertBox
                        variant="warning"
                        title={<Translation id="earn.earnFormScreen.networkFeeWarning" />}
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
