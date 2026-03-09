import { useSelector } from 'react-redux';

import { RouteProp, useRoute } from '@react-navigation/native';

import { AccountsRootState, selectAccountByKey } from '@suite-common/wallet-core';
import { AccountDetailsCard } from '@suite-native/accounts';
import { Box } from '@suite-native/atoms';
import { Form } from '@suite-native/forms';
import { RootStackParamList, RootStackRoutes, Screen } from '@suite-native/navigation';

import { EarnFormScreenFooter } from '../components/EarnFormScreenFooter';
import { EarnFormScreenHeader } from '../components/EarnFormScreenHeader';
import { EarnOutputFields } from '../components/EarnOutputFields';
import { useEarnForm } from '../hooks/useEarnForm';

export const EarnFormScreen = () => {
    const route = useRoute<RouteProp<RootStackParamList, RootStackRoutes.EarnForm>>();
    const { accountKey } = route.params;

    const account = useSelector((state: AccountsRootState) =>
        selectAccountByKey(state, accountKey),
    );

    const earnForm = useEarnForm(accountKey);

    if (!account || !earnForm) {
        return null;
    }

    const { form, handleSubmitEarnForm, amountValue } = earnForm;
    const {
        formState: { isValid },
    } = form;

    return (
        <Screen
            header={<EarnFormScreenHeader accountKey={accountKey} />}
            footer={
                <EarnFormScreenFooter
                    accountKey={accountKey}
                    symbol={account.symbol}
                    amountValue={amountValue}
                    isFormValid={isValid}
                    onPress={handleSubmitEarnForm}
                />
            }
        >
            <AccountDetailsCard accountKey={accountKey} variant="stake" />

            <Box marginTop="sp16">
                <Form form={form}>
                    <EarnOutputFields accountKey={accountKey} />
                </Form>
            </Box>
        </Screen>
    );
};
