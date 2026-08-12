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
import { getTransactionCompleteRows } from '../components/TransactionCompleteScreenPresets';
import { YieldCompleteScreenContent } from '../components/YieldCompleteScreenContent';

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

    const handleDone = () => {
        navigation.goBack();
    };

    if (!account) {
        return null;
    }

    const subtitle =
        entryPeriodInDays !== undefined ? (
            <Translation
                id="earn.transactionCompleteScreen.stakeDescription"
                values={{ days: entryPeriodInDays }}
            />
        ) : undefined;

    return (
        <YieldCompleteScreenContent
            type="stake"
            feedbackCategory="staking"
            buttonTranslationId="earn.transactionCompleteScreen.doneButton"
            onButtonPress={handleDone}
            rows={getTransactionCompleteRows({
                accountSymbol: account.symbol,
                amountInBaseUnits,
                amountLabel: <Translation id="earn.transactionCompleteScreen.stakeAmountLabel" />,
                apyValue: isApyAvailable(apy) ? (
                    <Text variant="body-md" color="contentBrand">
                        <ApyValue apy={apy} />
                    </Text>
                ) : undefined,
            })}
            title={<Translation id="earn.transactionCompleteScreen.stakeTitle" />}
            subtitle={subtitle}
        />
    );
};
