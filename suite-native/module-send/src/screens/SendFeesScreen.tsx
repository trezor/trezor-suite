import { useSelector } from 'react-redux';

import { AccountsRootState, selectAccountByKey } from '@suite-common/wallet-core';
import { SendStackParamList, SendStackRoutes, StackProps } from '@suite-native/navigation';

import { AccountBalanceScreenHeader } from '../components/AccountBalanceScreenHeader';
import { SendFeesForm } from '../components/SendFeesForm';
import { SendScreen } from '../components/SendScreen';

export const SendFeesScreen = ({
    route: { params },
}: StackProps<SendStackParamList, SendStackRoutes.SendFees>) => {
    const { accountKey, tokenContract } = params;

    const account = useSelector((state: AccountsRootState) =>
        selectAccountByKey(state, accountKey),
    );
    if (!account) return;

    return (
        <SendScreen
            screenHeader={
                <AccountBalanceScreenHeader accountKey={accountKey} tokenContract={tokenContract} />
            }
        >
            <SendFeesForm accountKey={accountKey} tokenContract={tokenContract} />
        </SendScreen>
    );
};
