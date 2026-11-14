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

import { SignVerifyForms } from '../components/SignVerifyForms';

export const SignVerifyScreen = ({
    route,
}: StackProps<RootStackParamList, RootStackRoutes.SignVerify>) => {
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
            <SignVerifyForms account={account} />
        </Screen>
    );
};
