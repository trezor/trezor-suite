import { useSelector } from 'react-redux';

import { AccountsRootState, selectAccountByKey } from '@suite-common/wallet-core';
import { Screen, SendStackParamList, SendStackRoutes, StackProps } from '@suite-native/navigation';

import { AccountBalanceScreenHeader } from '../components/AccountBalanceScreenHeader';
import { SendFeesForm } from '../components/SendFeesForm';

// TODO(#25541): Phase 7 - Remove SendFeesScreen from send flow (unused after Phase 1).
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
