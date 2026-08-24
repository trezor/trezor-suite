import { useMemo } from 'react';
import { useSelector } from 'react-redux';

import { type RouteProp, useNavigation, useRoute } from '@react-navigation/native';

import { type AccountsRootState, selectAccountByKey } from '@suite-common/wallet-core';
import { isApyAvailable } from '@suite-common/wallet-utils';
import { Text } from '@suite-native/atoms';
import { Translation } from '@suite-native/intl';
import { type RootStackParamList, type RootStackRoutes } from '@suite-native/navigation';
import {
    type NativeStakingRootState,
    selectApy,
    selectEntryPeriodInDaysBySymbol,
} from '@suite-native/staking';

import { ApyValue } from '../components/ApyValue';
import { EarnCompleteScreenContent } from '../components/EarnCompleteScreenContent';
import { getTransactionCompleteRows } from '../components/TransactionCompleteScreenPresets';

type RouteProps = RouteProp<RootStackParamList, RootStackRoutes.EarnTransactionComplete>;

export const EarnTransactionCompleteScreen = () => {
    const route = useRoute<RouteProps>();
    const navigation = useNavigation();
    const { accountKey, amountInBaseUnits } = route.params;

    const account = useSelector((state: AccountsRootState) =>
        selectAccountByKey(state, accountKey),
    );

    const entryPeriodInDays = useSelector((state: NativeStakingRootState) =>
        selectEntryPeriodInDaysBySymbol(state, account?.symbol),
    );

    const apy = useSelector((state: NativeStakingRootState) =>
        selectApy(state, { accountKey, networkSymbol: account?.symbol }),
    );

    const rows = useMemo(() => {
        if (!account) return [];

        const apyValue = isApyAvailable(apy) && (
            <Text variant="body-md" color="contentBrand">
                <ApyValue apy={apy} />
            </Text>
        );

        return getTransactionCompleteRows({
            accountSymbol: account.symbol,
            amountInBaseUnits,
            amountLabel: <Translation id="earn.transactionCompleteScreen.stakeAmountLabel" />,
            apyValue,
        });
    }, [account, amountInBaseUnits, apy]);

    if (!account) return null;

    return (
        <EarnCompleteScreenContent
            type="stake"
            feedbackCategory="staking"
            buttonTranslationId="earn.transactionCompleteScreen.doneButton"
            onButtonPress={navigation.goBack}
            rows={rows}
            title={<Translation id="earn.transactionCompleteScreen.stakeTitle" />}
            subtitle={
                entryPeriodInDays && (
                    <Translation
                        id="earn.transactionCompleteScreen.stakeDescription"
                        values={{ days: entryPeriodInDays }}
                    />
                )
            }
        />
    );
};
