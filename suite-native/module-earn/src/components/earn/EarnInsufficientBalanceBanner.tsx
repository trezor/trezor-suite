import { useSelector } from 'react-redux';

import { useNavigation } from '@react-navigation/native';

import { getNetworkDisplaySymbol } from '@suite-common/wallet-config';
import { type AccountsRootState, selectAccountByKey } from '@suite-common/wallet-core';
import { type AccountKey } from '@suite-common/wallet-types';
import { getStakingLimitsByNetworkSymbol } from '@suite-common/wallet-utils';
import { BannerInline } from '@suite-native/atoms';
import { Translation } from '@suite-native/intl';
import {
    AppTabsRoutes,
    type RootStackParamList,
    RootStackRoutes,
    type StackNavigationProps,
    TradingStackRoutes,
} from '@suite-native/navigation';
import { selectIsTradingEnabled } from '@suite-native/trading-state';

import { isBalanceBelowStakingMinimum } from '../../utils/staking/isBalanceBelowStakingMinimum';

type EarnInsufficientBalanceBannerProps = {
    accountKey: AccountKey;
};

type NavigationProp = StackNavigationProps<RootStackParamList, RootStackRoutes.EarnForm>;

export const EarnInsufficientBalanceBanner = ({
    accountKey,
}: EarnInsufficientBalanceBannerProps) => {
    const navigation = useNavigation<NavigationProp>();
    const account = useSelector((state: AccountsRootState) =>
        selectAccountByKey(state, accountKey),
    );
    const isTradingEnabled = useSelector(selectIsTradingEnabled);

    const limits = account ? getStakingLimitsByNetworkSymbol(account.symbol) : null;

    if (!account || !limits || !isBalanceBelowStakingMinimum(account)) return null;

    const displaySymbol = getNetworkDisplaySymbol(account.symbol);

    const handleBuy = () => {
        navigation.navigate(RootStackRoutes.AppTabs, {
            screen: AppTabsRoutes.TradeStack,
            params: {
                screen: TradingStackRoutes.Trading,
                params: { tradingType: 'exchange' },
            },
        });
    };

    const title = (
        <Translation
            id="earn.earnFormScreen.insufficientBalanceBanner"
            values={{
                minAmount: limits.MIN_AMOUNT_FOR_STAKING.toString(),
                displaySymbol,
            }}
        />
    );

    if (!isTradingEnabled) {
        return <BannerInline marginTop="sp16" intent="warning" title={title} />;
    }

    return (
        <BannerInline
            marginTop="sp16"
            intent="warning"
            title={title}
            buttonLabel={
                <Translation
                    id="earn.earnFormScreen.insufficientBalanceBannerButton"
                    values={{ displaySymbol }}
                />
            }
            onButtonPress={handleBuy}
        />
    );
};
