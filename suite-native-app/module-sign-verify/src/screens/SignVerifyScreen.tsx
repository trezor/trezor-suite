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
import { useServices } from '@trezor/dependency-injection';
import { injectGetSignVerify } from '@trezor/network-module-suite-native-types';

export const SignVerifyScreen = ({
    route,
}: StackProps<RootStackParamList, RootStackRoutes.SignVerify>) => {
    const { accountKey } = route.params;
    const { getSignVerify } = useServices(injectGetSignVerify);

    const account = useSelector((state: AccountsRootState) =>
        selectAccountByKey(state, accountKey),
    );

    if (!account) {
        return null;
    }

    const signVerify = getSignVerify(account.symbol);

    if (signVerify === null) {
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
            <signVerify.Component networkSymbol={account.symbol} account={account} />
        </Screen>
    );
};
