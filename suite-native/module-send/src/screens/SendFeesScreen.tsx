import { useSelector } from 'react-redux';

import { type AccountsRootState, selectAccountByKey } from '@suite-common/wallet-core';
import {
    Screen,
    type SendStackParamList,
    type SendStackRoutes,
    type StackProps,
} from '@suite-native/navigation';

import { AccountBalanceScreenHeader } from '../components/AccountBalanceScreenHeader';
import { SendFeesForm } from '../components/SendFeesForm';

export const SendFeesScreen = ({
    route: { params },
}: StackProps<SendStackParamList, SendStackRoutes.SendFees>) => {
    const { accountKey, tokenContract } = params;

    const account = useSelector((state: AccountsRootState) =>
        selectAccountByKey(state, accountKey),
    );

    return (
        <Screen
            header={
                <AccountBalanceScreenHeader accountKey={accountKey} tokenContract={tokenContract} />
            }
        >
            {account && <SendFeesForm accountKey={accountKey} tokenContract={tokenContract} />}
        </Screen>
    );
};
