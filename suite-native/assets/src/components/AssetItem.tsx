import React from 'react';
import { useSelector, useStore } from 'react-redux';

import { useNavigation } from '@react-navigation/native';

import { BASE_CRYPTO_MAX_DISPLAYED_DECIMALS, useFormatters } from '@suite-common/formatters';
import { type NetworkSymbol } from '@suite-common/wallet-config';
import { selectVisibleDeviceAccountsByNetworkSymbol } from '@suite-common/wallet-core';
import { asBaseCurrencyAmount } from '@suite-common/wallet-types';
import { AccountsListItemBase, StakingBadge } from '@suite-native/accounts';
import { Badge, Box, Text } from '@suite-native/atoms';
import { BaseCurrencyAmountFormatter, CryptoAmountFormatter } from '@suite-native/formatters';
import { CryptoIconWithPercentage, Icon } from '@suite-native/icons';
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
import { BigNumber } from '@trezor/utils';

import {
    type AssetsRootState,
    selectAssetCryptoValue,
    selectAssetFiatValue,
    selectAssetFiatValuePercentage,
} from '../assetsSelectors';

type AssetItemProps = {
    cryptoCurrencySymbol: NetworkSymbol;
};

type NavigationType = TabToStackCompositeNavigationProp<
    AppTabsParamList,
    AppTabsRoutes.HomeStack,
    RootStackParamList
>;

type AssetItemSubComponentProps = { symbol: NetworkSymbol };

const CryptoAmount = React.memo(({ symbol }: AssetItemSubComponentProps) => {
    const cryptoValue = useSelector((state: AssetsRootState) =>
        selectAssetCryptoValue(state, symbol),
    );

    return (
        <CryptoAmountFormatter
            value={cryptoValue}
            symbol={symbol}
            // Every asset crypto amount is rounded to 8 decimals to prevent UI overflow.
            decimals={BASE_CRYPTO_MAX_DISPLAYED_DECIMALS}
            testID={`@assets/cryptoAmount/${symbol}`}
        />
    );
});

const FiatAmount = React.memo(({ symbol }: AssetItemSubComponentProps) => {
    const fiatValue = useSelector((state: AssetsRootState) => selectAssetFiatValue(state, symbol));

    return (
        <BaseCurrencyAmountFormatter
            symbol={symbol}
            value={fiatValue !== null ? asBaseCurrencyAmount(new BigNumber(fiatValue)) : null}
        />
    );
});

const PercentageIcon = React.memo(({ symbol }: AssetItemSubComponentProps) => {
    const assetPercentages = useSelector((state: AssetsRootState) =>
        selectAssetFiatValuePercentage(state, symbol),
    );

    return (
        <CryptoIconWithPercentage
            iconName={symbol}
            percentage={assetPercentages?.fiatPercentage}
            percentageOffset={assetPercentages?.fiatPercentageOffset}
        />
    );
});

export const AssetItem = React.memo(({ cryptoCurrencySymbol }: AssetItemProps) => {
    const navigation = useNavigation<NavigationType>();
    const store = useStore<AssetsRootState>();
    const { NetworkNameFormatter } = useFormatters();
    // Subscribe only to the count (a number, compared with `===`) so the row chrome re-renders
    // when an account is added/removed, not on every balance tick during discovery.
    const accountsPerAsset = useSelector(
        (state: AssetsRootState) =>
            selectVisibleDeviceAccountsByNetworkSymbol(state, cryptoCurrencySymbol).length,
    );
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
                    <Text variant="body-sm" color="contentSecondary">
                        {accountsPerAsset}
                    </Text>
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
