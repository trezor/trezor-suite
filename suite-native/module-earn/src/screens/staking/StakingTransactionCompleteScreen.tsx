import { useMemo } from 'react';
import { useSelector } from 'react-redux';

import { type RouteProp, useNavigation, useRoute } from '@react-navigation/native';

import {
    type AccountsRootState,
    type StakeRootState,
    selectAccountByKey,
    selectApy,
    selectEntryPeriodInDaysBySymbol,
} from '@suite-common/wallet-core';
import { isApyAvailable } from '@suite-common/wallet-utils';
import { Text } from '@suite-native/atoms';
import { Translation, type TxKeyPath } from '@suite-native/intl';
import { type RootStackParamList, type RootStackRoutes } from '@suite-native/navigation';

import { ApyValue } from '../../components/earn/ApyValue';
import { EarnCompleteScreenContent } from '../../components/earn/EarnCompleteScreenContent';
import { getTransactionCompleteRows } from '../../components/staking/TransactionCompleteScreenPresets';
import { type EarnFormDraftPrefix } from '../../types';

const titleTranslationId: Record<EarnFormDraftPrefix, TxKeyPath> = {
    stake: 'earn.transactionCompleteScreen.stakeTitle',
    unstake: 'earn.transactionCompleteScreen.unstakeTitle',
    claim: 'earn.transactionCompleteScreen.claimTitle',
};

const amountLabelTranslationId: Record<EarnFormDraftPrefix, TxKeyPath> = {
    stake: 'earn.transactionCompleteScreen.stakeAmountLabel',
    unstake: 'earn.transactionCompleteScreen.unstakeAmountLabel',
    claim: 'earn.transactionCompleteScreen.claimAmountLabel',
};

type RouteProps = RouteProp<RootStackParamList, RootStackRoutes.StakingTransactionComplete>;

export const StakingTransactionCompleteScreen = () => {
    const route = useRoute<RouteProps>();
    const { accountKey, stakeType, amountInBaseUnits } = route.params;
    const navigation = useNavigation();

    const account = useSelector((state: AccountsRootState) =>
        selectAccountByKey(state, accountKey),
    );

    const entryPeriodInDays = useSelector((state: StakeRootState) =>
        stakeType === 'stake' ? selectEntryPeriodInDaysBySymbol(state, account?.symbol) : undefined,
    );

    const apy = useSelector((state: StakeRootState) =>
        stakeType === 'stake'
            ? selectApy(state, { accountKey, networkSymbol: account?.symbol })
            : null,
    );

    const rows = useMemo(() => {
        if (!account) return [];

        const apyValue =
            stakeType === 'stake' && isApyAvailable(apy) ? (
                <Text variant="body-md" color="contentBrand">
                    <ApyValue apy={apy} />
                </Text>
            ) : null;

        return getTransactionCompleteRows({
            accountSymbol: account.symbol,
            amountInBaseUnits,
            amountLabel: <Translation id={amountLabelTranslationId[stakeType]} />,
            apyValue,
        });
    }, [stakeType, account, amountInBaseUnits, apy]);

    return (
        <EarnCompleteScreenContent
            type={stakeType}
            feedbackCategory="staking"
            buttonTranslationId="earn.transactionCompleteScreen.doneButton"
            onButtonPress={navigation.goBack}
            rows={rows}
            title={<Translation id={titleTranslationId[stakeType]} />}
            subtitle={
                stakeType === 'stake' &&
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
