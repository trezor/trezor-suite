import React from 'react';
import { useSelector } from 'react-redux';

import { useNavigation } from '@react-navigation/native';

import { useFormatters } from '@suite-common/formatters';
import { useSelectorDeepComparison } from '@suite-common/redux-utils';
import { type NetworkSymbol } from '@suite-common/wallet-config';
import { AccountsListItemBase, StakingBadge } from '@suite-native/accounts';
import { Badge, Box, Text } from '@suite-native/atoms';
import { CryptoAmountFormatter, FiatAmountFormatter } from '@suite-native/formatters';
import { CryptoIconWithPercentage, Icon } from '@suite-native/icons';
import { Translation } from '@suite-native/intl';
import {
    AppTabsParamList,
    AppTabsRoutes,
    RootStackParamList,
    RootStackRoutes,
    TabToStackCompositeNavigationProp,
} from '@suite-native/navigation';
import {
    NativeStakingRootState,
    selectHasAnyDeviceAccountsWithStaking,
} from '@suite-native/staking';
import { TokensRootState, selectHasDeviceAnyTokensForNetwork } from '@suite-native/tokens';

import {
    AssetsRootState,
    selectAssetCryptoValue,
    selectAssetFiatValue,
    selectAssetFiatValuePercentage,
    selectVisibleDeviceAccountsKeysByNetworkSymbol,
} from '../assetsSelectors';

type AssetItemProps = {
    cryptoCurrencySymbol: NetworkSymbol;
    onPress?: (symbol: NetworkSymbol) => void;
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

            decimals={8}
            testID={`@assets/cryptoAmount/${symbol}`}
        />
    );
});

const FiatAmount = React.memo(({ symbol }: AssetItemSubComponentProps) => {
    const fiatValue = useSelector((state: AssetsRootState) => selectAssetFiatValue(state, symbol));

    return <FiatAmountFormatter symbol={symbol} value={fiatValue} />;
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

export const AssetItem = React.memo(({ cryptoCurrencySymbol, onPress }: AssetItemProps) => {
    const navigation = useNavigation<NavigationType>();
    const { NetworkNameFormatter } = useFormatters();
    const accountsKeysForNetworkSymbol = useSelectorDeepComparison((state: AssetsRootState) =>
        selectVisibleDeviceAccountsKeysByNetworkSymbol(state, cryptoCurrencySymbol),
    );

    const accountsPerAsset = accountsKeysForNetworkSymbol.length;
    const hasAnyTokens = useSelector((state: TokensRootState) =>
        selectHasDeviceAnyTokensForNetwork(state, cryptoCurrencySymbol),
    );
    const hasAnyAccountsWithStaking = useSelector((state: NativeStakingRootState) =>
        selectHasAnyDeviceAccountsWithStaking(state, cryptoCurrencySymbol),
    );

    const handleAssetPress = () => {
        if (accountsPerAsset === 1 && !hasAnyTokens) {
            navigation.navigate(RootStackRoutes.AccountDetail, {
                accountKey: accountsKeysForNetworkSymbol[0],
                closeActionType: 'back',
            });
        } else if (onPress) {
            onPress(cryptoCurrencySymbol);
        }
    };

    return (
        <AccountsListItemBase
            disabled={!onPress}
            onPress={handleAssetPress}
            icon={<PercentageIcon symbol={cryptoCurrencySymbol} />}
            title={<NetworkNameFormatter value={cryptoCurrencySymbol} />}
            badges={
                <>
                    <Box>
                        <Icon size="medium" color="iconSubdued" name="wallet" />
                    </Box>
                    <Text variant="hint" color="textSubdued">
                        {accountsPerAsset}
                    </Text>
                    {hasAnyAccountsWithStaking && <StakingBadge />}
                    {hasAnyTokens && (
                        <Badge
                            elevation="1"
                            size="small"
                            label={<Translation id="generic.tokens" />}
                        />
                    )}
                </>
            }
            mainValue={<FiatAmount symbol={cryptoCurrencySymbol} />}
            secondaryValue={<CryptoAmount symbol={cryptoCurrencySymbol} />}
        />
    );
});

AssetItem.displayName = 'AssetItem';
