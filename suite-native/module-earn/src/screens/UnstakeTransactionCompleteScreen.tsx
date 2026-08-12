import { useSelector } from 'react-redux';

import { type RouteProp, useNavigation, useRoute } from '@react-navigation/native';

import { type AccountsRootState, selectAccountByKey } from '@suite-common/wallet-core';
import { Translation } from '@suite-native/intl';
import { type RootStackParamList, type RootStackRoutes } from '@suite-native/navigation';

import { getTransactionCompleteRows } from '../components/TransactionCompleteScreenPresets';
import { YieldCompleteScreenContent } from '../components/YieldCompleteScreenContent';

type RouteProps = RouteProp<RootStackParamList, RootStackRoutes.UnstakeTransactionComplete>;

export const UnstakeTransactionCompleteScreen = () => {
    const route = useRoute<RouteProps>();
    const navigation = useNavigation();
    const { accountKey, amountInBaseUnits } = route.params;

    const account = useSelector((state: AccountsRootState) =>
        selectAccountByKey(state, accountKey),
    );

    const handleDone = () => {
        navigation.goBack();
    };

    if (!account) {
        return null;
    }

    return (
        <YieldCompleteScreenContent
            type="unstake"
            feedbackCategory="staking"
            buttonTranslationId="earn.transactionCompleteScreen.doneButton"
            onButtonPress={handleDone}
            rows={getTransactionCompleteRows({
                accountSymbol: account.symbol,
                amountInBaseUnits,
                amountLabel: <Translation id="earn.transactionCompleteScreen.unstakeAmountLabel" />,
            })}
            title={<Translation id="earn.transactionCompleteScreen.unstakeTitle" />}
        />
    );
};
