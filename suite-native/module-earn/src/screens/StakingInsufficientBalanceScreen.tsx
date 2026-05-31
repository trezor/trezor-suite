import { type RouteProp, useRoute } from '@react-navigation/native';

import { getNetworkDisplaySymbol } from '@suite-common/wallet-config';
import { getStakingLimitsByNetworkSymbol, parseAccountKey } from '@suite-common/wallet-utils';
import { Translation } from '@suite-native/intl';
import {
    type RootStackParamList,
    type RootStackRoutes,
    Screen,
    ScreenHeader,
} from '@suite-native/navigation';

import { EarnInsufficientBalanceContent } from '../components/EarnInsufficientBalanceContent';

export const StakingInsufficientBalanceScreen = () => {
    const route =
        useRoute<RouteProp<RootStackParamList, RootStackRoutes.StakingInsufficientBalance>>();
    const { accountKey } = route.params;
    const { networkSymbol } = parseAccountKey(accountKey);
    const displaySymbol = getNetworkDisplaySymbol(networkSymbol);
    const limits = getStakingLimitsByNetworkSymbol(networkSymbol);
    const minAmount = limits?.MIN_AMOUNT_FOR_STAKING?.toString() ?? '0';

    return (
        <Screen header={<ScreenHeader closeActionType="back" />}>
            <EarnInsufficientBalanceContent
                title={
                    <Translation
                        id="earn.stakingInsufficientBalance.title"
                        values={{ displaySymbol }}
                    />
                }
                subtitle={
                    <Translation
                        id="earn.stakingInsufficientBalance.subtitle"
                        values={{ minAmount, displaySymbol }}
                    />
                }
                primaryButtonContent={
                    <Translation
                        id="earn.stakingInsufficientBalance.getButton"
                        values={{ displaySymbol }}
                    />
                }
            />
        </Screen>
    );
};
