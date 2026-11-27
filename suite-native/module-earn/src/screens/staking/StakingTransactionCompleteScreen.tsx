import { useMemo } from 'react';
import { useSelector } from 'react-redux';

import { type RouteProp, useNavigation, useRoute } from '@react-navigation/native';

import {
    type StakingAccountProductRootState,
    selectStakingAccountProductDescriptor,
    useNetworkStakingPeriods,
    useNetworkStakingRate,
} from '@suite-common/earn-staking';
import { type AccountsRootState, selectAccountByKey } from '@suite-common/wallet-core';
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

    // Only a stake shows its rate and entry period.
    const stakedNetworkSymbol = stakeType === 'stake' ? (account?.symbol ?? null) : null;
    const productId = useSelector(
        (state: StakingAccountProductRootState) =>
            selectStakingAccountProductDescriptor(state, accountKey)?.id,
    );
    const { entryPeriodDays } = useNetworkStakingPeriods(stakedNetworkSymbol);
    const { rate } = useNetworkStakingRate({ networkSymbol: stakedNetworkSymbol, accountKey });

    const rows = useMemo(() => {
        if (!account) return [];

        const apyValue =
            stakeType === 'stake' && isApyAvailable(rate) ? (
                <Text variant="body-md" color="contentBrand">
                    <ApyValue apy={rate} />
                </Text>
            ) : undefined;

        return getTransactionCompleteRows({
            accountSymbol: account.symbol,
            amountInBaseUnits,
            amountLabel: <Translation id={amountLabelTranslationId[stakeType]} />,
            apyValue,
        });
    }, [stakeType, account, amountInBaseUnits, rate]);

    return (
        <EarnCompleteScreenContent
            type={stakeType}
            feedbackFeature="staking"
            feedbackContext={{ productId }}
            buttonTranslationId="earn.transactionCompleteScreen.doneButton"
            onButtonPress={navigation.goBack}
            rows={rows}
            title={<Translation id={titleTranslationId[stakeType]} />}
            subtitle={
                stakeType === 'stake' &&
                entryPeriodDays !== null && (
                    <Translation
                        id="earn.transactionCompleteScreen.stakeDescription"
                        values={{ days: entryPeriodDays }}
                    />
                )
            }
        />
    );
};
