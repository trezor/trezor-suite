import { memo } from 'react';
import { useSelector } from 'react-redux';

import { useNavigation } from '@react-navigation/native';

import { useFormatters } from '@suite-common/formatters';
import { type NetworkSymbol } from '@suite-common/wallet-config';
import { AccountsListItemBase, StakingBadge } from '@suite-native/accounts';
import { Badge, Box } from '@suite-native/atoms';
import { Icon } from '@suite-native/icons';
import { Translation } from '@suite-native/intl';
import {
    AccountsStackRoutes,
    type AppTabsParamList,
    AppTabsRoutes,
    type RootStackParamList,
    RootStackRoutes,
    type TabToStackCompositeNavigationProp,
} from '@suite-native/navigation';
import {
    type NativeStakingRootState,
    selectHasAnyDeviceAccountsWithStaking,
} from '@suite-native/staking';
import { type TokensRootState, selectHasDeviceAnyTokensForNetwork } from '@suite-native/tokens';

import { selectSingleDeviceAccountKeyForNetworkSymbol } from '../assetsSelectors';
import { AccountsCount } from './AccountsCount';
import { CryptoAmount } from './CryptoAmount';
import { FiatAmount } from './FiatAmount';
import { PercentageIcon } from './PercentageIcon';
import { type AssetsRootState } from '../types';

type AssetItemProps = {
    cryptoCurrencySymbol: NetworkSymbol;
};

type NavigationType = TabToStackCompositeNavigationProp<
    AppTabsParamList,
    AppTabsRoutes.HomeStack,
    RootStackParamList
>;

// Memoized so existing rows bail when `Assets` re-renders to add a newly discovered network.
// Sub-components aren't memoized: each subscribes to its own value, and this rarely re-renders.
export const AssetItem = memo(({ cryptoCurrencySymbol }: AssetItemProps) => {
    const navigation = useNavigation<NavigationType>();
    const { NetworkNameFormatter } = useFormatters();
    const singleAccountKey = useSelector((state: AssetsRootState) =>
        selectSingleDeviceAccountKeyForNetworkSymbol(state, cryptoCurrencySymbol),
    );
    const hasAnyTokens = useSelector((state: TokensRootState) =>
        selectHasDeviceAnyTokensForNetwork(state, cryptoCurrencySymbol),
    );
    const hasAnyAccountsWithStaking = useSelector((state: NativeStakingRootState) =>
        selectHasAnyDeviceAccountsWithStaking(state, cryptoCurrencySymbol),
    );

    const handleAssetPress = () => {
        // A single tokenless account opens its detail directly; anything else opens the list.
        if (singleAccountKey && !hasAnyTokens && !hasAnyAccountsWithStaking) {
            navigation.navigate(RootStackRoutes.AccountDetail, {
                accountKey: singleAccountKey,
                closeActionType: 'back',
            });
        } else {
            navigation.navigate(AppTabsRoutes.AccountsStack, {
                screen: AccountsStackRoutes.Accounts,
                params: { networksFilter: [cryptoCurrencySymbol] },
            });
        }
    };

    return (
        <AccountsListItemBase
            onPress={handleAssetPress}
            icon={<PercentageIcon symbol={cryptoCurrencySymbol} />}
            title={<NetworkNameFormatter value={cryptoCurrencySymbol} />}
            badges={
                <>
                    <Box>
                        <Icon size="medium" color="contentSecondary" name="wallet" />
                    </Box>
                    <AccountsCount symbol={cryptoCurrencySymbol} />
                    {hasAnyAccountsWithStaking && (
                        <StakingBadge networkSymbol={cryptoCurrencySymbol} />
                    )}
                    {hasAnyTokens && (
                        <Badge size="small" label={<Translation id="generic.tokens" />} />
                    )}
                </>
            }
            mainValue={<FiatAmount symbol={cryptoCurrencySymbol} />}
            secondaryValue={<CryptoAmount symbol={cryptoCurrencySymbol} />}
        />
    );
});

AssetItem.displayName = 'AssetItem';
