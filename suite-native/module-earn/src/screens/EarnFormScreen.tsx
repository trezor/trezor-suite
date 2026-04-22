import { type RouteProp, useNavigation, useRoute } from '@react-navigation/native';

import { AccountDetailsCard } from '@suite-native/accounts';
import { Box } from '@suite-native/atoms';
import { Form } from '@suite-native/forms';
import {
    type RootStackParamList,
    RootStackRoutes,
    Screen,
    type StackNavigationProps,
} from '@suite-native/navigation';
import { FeeSelector } from '@suite-native/transaction-management';

import { EarnFormScreenFooter } from '../components/EarnFormScreenFooter';
import { EarnFormScreenHeader } from '../components/EarnFormScreenHeader';
import { EarnOutputFields } from '../components/EarnOutputFields';
import { useEarnForm } from '../hooks/useEarnForm';

export const EarnFormScreen = () => {
    const route = useRoute<RouteProp<RootStackParamList, RootStackRoutes.EarnForm>>();
    const { accountKey } = route.params;
    const navigation =
        useNavigation<StackNavigationProps<RootStackParamList, RootStackRoutes.EarnForm>>();

    const earnForm = useEarnForm(accountKey);

    if (!earnForm) {
        return null;
    }

    const { form, amountValue, account, formDraft, formDraftKey, updateFeeLevelThunk } = earnForm;
    const {
        formState: { isValid },
    } = form;

    const handleSubmit = form.handleSubmit(() => {
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
                    accountKey={accountKey}
                    symbol={account.symbol}
                    amountValue={amountValue}
                    isDisabled={!isValid}
                    onPress={() => handleSubmit()}
                />
            }
        >
            <AccountDetailsCard accountKey={accountKey} isStakeVariant />
            <Box marginTop="sp16">
                <Form form={form}>
                    <EarnOutputFields accountKey={accountKey} />
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
