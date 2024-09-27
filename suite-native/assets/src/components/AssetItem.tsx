import React from 'react';
import { useSelector } from 'react-redux';

import { useNavigation } from '@react-navigation/native';

import { useFormatters } from '@suite-common/formatters';
import { CryptoIconWithPercentage, Icon } from '@suite-common/icons-deprecated';
import { useSelectorDeepComparison } from '@suite-common/redux-utils';
import { TokenDefinitionsRootState } from '@suite-common/token-definitions';
import { NetworkSymbol } from '@suite-common/wallet-config';
import { AccountsRootState, DeviceRootState } from '@suite-common/wallet-core';
import { AccountsListItemBase, StakingBadge } from '@suite-native/accounts';
import { Badge, Box, Text } from '@suite-native/atoms';
import { CryptoAmountFormatter, FiatAmountFormatter } from '@suite-native/formatters';
import { Translation } from '@suite-native/intl';
import {
    AppTabsParamList,
    AppTabsRoutes,
    RootStackParamList,
    RootStackRoutes,
    TabToStackCompositeNavigationProp,
} from '@suite-native/navigation';
import { selectHasDeviceAnyTokens } from '@suite-native/tokens';
import {
    selectHasAnyDeviceAccountsWithStaking,
    NativeStakingRootState,
} from '@suite-native/staking';

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

const CryptoAmount = React.memo(({ network }: { network: NetworkSymbol }) => {
    const cryptoValue = useSelector((state: AssetsRootState) =>
        selectAssetCryptoValue(state, network),
    );

    return (
        <CryptoAmountFormatter
            value={cryptoValue}
            network={network}
            // Every asset crypto amount is rounded to 8 decimals to prevent UI overflow.

            decimals={8}
        />
    );
});

const FiatAmount = React.memo(({ network }: { network: NetworkSymbol }) => {
    const fiatValue = useSelector((state: AssetsRootState) => selectAssetFiatValue(state, network));

    return <FiatAmountFormatter network={network} value={fiatValue} />;
});

const PercentageIcon = React.memo(({ network }: { network: NetworkSymbol }) => {
    const assetPercentages = useSelector((state: AssetsRootState) =>
        selectAssetFiatValuePercentage(state, network),
    );

    return (
        <CryptoIconWithPercentage
            iconName={network}
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
    const hasAnyTokens = useSelector(
        (state: AccountsRootState & DeviceRootState & TokenDefinitionsRootState) =>
            selectHasDeviceAnyTokens(state, cryptoCurrencySymbol),
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
            icon={<PercentageIcon network={cryptoCurrencySymbol} />}
            title={<NetworkNameFormatter value={cryptoCurrencySymbol} />}
            badges={
                <>
                    <Box>
                        <Icon size="medium" color="iconSubdued" name="standardWallet" />
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
            mainValue={<FiatAmount network={cryptoCurrencySymbol} />}
            secondaryValue={<CryptoAmount network={cryptoCurrencySymbol} />}
        />
    );
});

AssetItem.displayName = 'AssetItem';
