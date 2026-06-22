import { memo } from 'react';
import { useSelector, useStore } from 'react-redux';

import { useNavigation } from '@react-navigation/native';

import { useFormatters } from '@suite-common/formatters';
import { type NetworkSymbol } from '@suite-common/wallet-config';
import { selectVisibleDeviceAccountsByNetworkSymbol } from '@suite-common/wallet-core';
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

import { type AssetsRootState } from '../assetsSelectors';
import { AccountsCount } from './AccountsCount';
import { CryptoAmount } from './CryptoAmount';
import { FiatAmount } from './FiatAmount';
import { PercentageIcon } from './PercentageIcon';

type AssetItemProps = {
    cryptoCurrencySymbol: NetworkSymbol;
};

type NavigationType = TabToStackCompositeNavigationProp<
    AppTabsParamList,
    AppTabsRoutes.HomeStack,
    RootStackParamList
>;

// Memoized because `Assets` re-renders every time a newly discovered network grows the list.
// Without this, each new network would re-render every existing row; with it, unchanged rows bail.
// `cryptoCurrencySymbol` is a stable primitive, so the memo is never silently defeated.
// The sub-components are intentionally NOT memoized - they each subscribe to their own value and
// re-render only when it changes, and this component rarely re-renders, so memoizing them adds
// no benefit (and a leaf memo can't hide an unstable selector anyway - that fires regardless).
export const AssetItem = memo(({ cryptoCurrencySymbol }: AssetItemProps) => {
    const navigation = useNavigation<NavigationType>();
    const store = useStore<AssetsRootState>();
    const { NetworkNameFormatter } = useFormatters();
    const hasAnyTokens = useSelector((state: TokensRootState) =>
        selectHasDeviceAnyTokensForNetwork(state, cryptoCurrencySymbol),
    );
    const hasAnyAccountsWithStaking = useSelector((state: NativeStakingRootState) =>
        selectHasAnyDeviceAccountsWithStaking(state, cryptoCurrencySymbol),
    );

    const handleAssetPress = () => {
        // Read the accounts lazily at press time to avoid subscribing the whole array to the store.
        const networkAccounts = selectVisibleDeviceAccountsByNetworkSymbol(
            store.getState(),
            cryptoCurrencySymbol,
        );

        if (networkAccounts.length === 1 && !hasAnyTokens && !hasAnyAccountsWithStaking) {
            navigation.navigate(RootStackRoutes.AccountDetail, {
                accountKey: networkAccounts[0]?.key,
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
