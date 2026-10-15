import { useMemo } from 'react';

import { useTranslation } from '@suite/intl';
import { selectWalletAssetName } from '@suite-common/assets';
import { Column } from '@trezor/components';

import { PageHeader } from 'src/components/suite/layouts/SuiteLayout';
import { useLayout, useSelector } from 'src/hooks/suite';

import { AssetDetailBalance } from './AssetDetailBalance';
import { AssetDetailTransactions } from './AssetDetailTransactions';
import { useAssetDetailKey } from './useAssetDetailKey';

export const AssetDetail = () => {
    const { translationString } = useTranslation();
    const assetKey = useAssetDetailKey();
    const name = useSelector(state =>
        assetKey === undefined ? undefined : selectWalletAssetName(state, assetKey),
    );
    const pageHeader = useMemo(() => <PageHeader />, []);

    useLayout(name ?? translationString('TR_ASSET'), pageHeader);

    // No wallet on screen, or one that does not hold the asset the route names.
    if (assetKey === undefined || name === undefined) {
        return null;
    }

    return (
        <Column gap={16} alignItems="stretch" data-testid="@asset-detail">
            <AssetDetailBalance assetKey={assetKey} />
            <AssetDetailTransactions assetKey={assetKey} />
        </Column>
    );
};
