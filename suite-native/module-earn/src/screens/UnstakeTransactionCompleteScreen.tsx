import { useMemo } from 'react';
import { useSelector } from 'react-redux';

import { type RouteProp, useNavigation, useRoute } from '@react-navigation/native';

import { type AccountsRootState, selectAccountByKey } from '@suite-common/wallet-core';
import { Translation } from '@suite-native/intl';
import { type RootStackParamList, type RootStackRoutes } from '@suite-native/navigation';

import { EarnCompleteScreenContent } from '../components/EarnCompleteScreenContent';
import { getTransactionCompleteRows } from '../components/TransactionCompleteScreenPresets';

type RouteProps = RouteProp<RootStackParamList, RootStackRoutes.UnstakeTransactionComplete>;

export const UnstakeTransactionCompleteScreen = () => {
    const route = useRoute<RouteProps>();
    const navigation = useNavigation();
    const { accountKey, amountInBaseUnits } = route.params;

    const account = useSelector((state: AccountsRootState) =>
        selectAccountByKey(state, accountKey),
    );

    const rows = useMemo(() => {
        if (!account) return [];

        return getTransactionCompleteRows({
            accountSymbol: account.symbol,
            amountInBaseUnits,
            amountLabel: <Translation id="earn.transactionCompleteScreen.unstakeAmountLabel" />,
        });
    }, [account, amountInBaseUnits]);

    if (!account) return null;

    return (
        <EarnCompleteScreenContent
            type="unstake"
            feedbackCategory="staking"
            buttonTranslationId="earn.transactionCompleteScreen.doneButton"
            onButtonPress={navigation.goBack}
            rows={rows}
            title={<Translation id="earn.transactionCompleteScreen.unstakeTitle" />}
        />
    );
};
