import { useMemo } from 'react';

import { useTranslation } from '@suite/intl';
import { selectWalletAssetName } from '@suite-common/assets';
import { Box, Column, Row } from '@trezor/components';

import { PageHeader } from 'src/components/suite/layouts/SuiteLayout';
import { useDiscovery, useLayout, useSelector } from 'src/hooks/suite';

import { AssetDetailBalance, AssetDetailBalanceSkeleton } from './AssetDetailBalance';
import { AssetDetailEarn } from './AssetDetailEarn';
import { AssetDetailHiddenBanner } from './AssetDetailHiddenBanner';
import { AssetDetailMarketPrice } from './AssetDetailMarketPrice';
import { AssetDetailTransactions } from './AssetDetailTransactions';
import { AssetNotExists } from './AssetNotExists';
import { selectRoutedAssetKey } from './selectRoutedAssetKey';

export const AssetDetail = () => {
    const { translationString } = useTranslation();
    const { isDiscoveryRunning } = useDiscovery();
    const assetKey = useSelector(selectRoutedAssetKey);
    const name = useSelector(state => selectWalletAssetName(state, assetKey));
    const pageHeader = useMemo(() => <PageHeader />, []);

    useLayout(name ?? translationString('TR_ASSET'), pageHeader);

    if (assetKey === undefined) {
        return isDiscoveryRunning ? <AssetDetailBalanceSkeleton /> : <AssetNotExists />;
    }

    return (
        <Column gap={16} alignItems="stretch" data-testid="@asset-detail">
            <AssetDetailHiddenBanner assetKey={assetKey} />
            <AssetDetailMarketPrice assetKey={assetKey} />
            <Row gap={16} alignItems="stretch" flexWrap="wrap">
                <Box flex="1" minWidth={280}>
                    <AssetDetailBalance assetKey={assetKey} />
                </Box>
                <AssetDetailEarn assetKey={assetKey} />
            </Row>
            <AssetDetailTransactions assetKey={assetKey} />
        </Column>
    );
};
