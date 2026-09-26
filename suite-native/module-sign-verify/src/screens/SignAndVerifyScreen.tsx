import { useSelector } from 'react-redux';

import { type AccountsRootState, selectAccountByKey } from '@suite-common/wallet-core';
import { AccountDetailScreenHeaderContent } from '@suite-native/accounts';
import {
    type RootStackParamList,
    type RootStackRoutes,
    Screen,
    ScreenHeader,
    type StackProps,
} from '@suite-native/navigation';

import { SignAndVerifyForms } from '../components/SignAndVerifyForms';

export const SignAndVerifyScreen = ({
    route,
}: StackProps<RootStackParamList, RootStackRoutes.SignAndVerify>) => {
    const { accountKey } = route.params;

    const account = useSelector((state: AccountsRootState) =>
        selectAccountByKey(state, accountKey),
    );

    if (!account) {
        return null;
    }

    return (
        <Screen
            header={
                <ScreenHeader
                    closeActionType="close"
                    customContent={<AccountDetailScreenHeaderContent account={account} />}
                />
            }
        >
            <SignAndVerifyForms account={account} />
        </Screen>
    );
};
