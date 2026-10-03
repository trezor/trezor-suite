import { useSelector } from 'react-redux';

import { type AssetsRootState, selectAssetAccountBalances } from '@suite-common/assets';
import { Box, Text, VStack } from '@suite-native/atoms';
import { Translation } from '@suite-native/intl';

import { AssetDetailAccountItem } from './AssetDetailAccountItem';
import { useAssetDetailRouteParams } from '../hooks/useAssetDetailRouteParams';

export const AssetDetailAccounts = () => {
    const { networkSymbol, tokenContract } = useAssetDetailRouteParams();
    const accountBalances = useSelector((state: AssetsRootState) =>
        selectAssetAccountBalances(state, networkSymbol, tokenContract),
    );

    if (accountBalances.length === 0) return null;

    return (
        <VStack paddingVertical="sp24" spacing="sp16">
            <Box paddingHorizontal="sp20">
                <Text variant="body-sm" color="contentSecondary">
                    <Translation
                        id="moduleAssets.assetDetailScreen.accountsSection.title"
                        values={{ count: accountBalances.length }}
                    />
                </Text>
            </Box>

            <VStack spacing={0}>
                {accountBalances.map(({ accountKey, accountLabel, cryptoBalance }) => (
                    <AssetDetailAccountItem
                        key={accountKey}
                        accountLabel={accountLabel}
                        cryptoBalance={cryptoBalance}
                    />
                ))}
            </VStack>
        </VStack>
    );
};
