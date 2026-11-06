import { useMemo } from 'react';

import { useTranslation } from '@suite/intl';
import {
    selectWalletAssetContractAddress,
    selectWalletAssetName,
    selectWalletAssetSymbol,
} from '@suite-common/assets';
import { Box, Column, Row } from '@trezor/components';
import {
    AssetDetailBalance,
    AssetDetailBalanceSkeleton,
    AssetDetailEarn,
    AssetDetailHiddenBanner,
    AssetDetailMarketPrice,
    AssetDetailStakingBanner,
    AssetDetailTransactions,
    AssetDetailYieldBanner,
    AssetNotExists,
    PageHeader,
    selectRoutedAssetKey,
    useDiscovery,
    useLayout,
    useSelector,
} from '@trezor/suite';

export const AssetDetailPage = () => {
    const { translationString } = useTranslation();
    const { isDiscoveryRunning } = useDiscovery();
    const assetKey = useSelector(selectRoutedAssetKey);
    const name = useSelector(state => selectWalletAssetName(state, assetKey));
    const symbol = useSelector(state => selectWalletAssetSymbol(state, assetKey));
    const contractAddress = useSelector(state => selectWalletAssetContractAddress(state, assetKey));
    const pageHeader = useMemo(() => <PageHeader />, []);

    useLayout(name ?? translationString('TR_ASSET'), pageHeader);

    if (assetKey === undefined || symbol === undefined) {
        return isDiscoveryRunning ? <AssetDetailBalanceSkeleton /> : <AssetNotExists />;
    }

    return (
        <Column gap={16} alignItems="stretch" data-testid="@asset-detail">
            <AssetDetailHiddenBanner assetKey={assetKey} />
            <AssetDetailMarketPrice symbol={symbol} contractAddress={contractAddress} />
            <Row gap={16} alignItems="stretch" flexWrap="wrap">
                <Box flex="1" minWidth={280}>
                    <AssetDetailBalance assetKey={assetKey} />
                </Box>
                <AssetDetailEarn assetKey={assetKey} />
            </Row>
            <AssetDetailStakingBanner assetKey={assetKey} />
            <AssetDetailYieldBanner assetKey={assetKey} />
            <AssetDetailTransactions assetKey={assetKey} />
        </Column>
    );
};
