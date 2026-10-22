import { useMemo } from 'react';

import { useTranslation } from '@suite/intl';
import { selectWalletAssetName } from '@suite-common/assets';
import { Column } from '@trezor/components';

import { PageHeader } from 'src/components/suite/layouts/SuiteLayout';
import { useDiscovery, useLayout, useSelector } from 'src/hooks/suite';

import { AssetDetailBalance, AssetDetailBalanceSkeleton } from './AssetDetailBalance';
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
            <AssetDetailBalance assetKey={assetKey} />
        </Column>
    );
};
