import { type RefObject } from 'react';

import { Translation, type TranslationKey } from '@suite/intl';
import { type TradingAssetOption } from '@suite-common/trading';
import { Button, Column, Paragraph, Row, Skeleton } from '@trezor/components';

import { GlobalReceiveAssetList } from '../components/GlobalReceiveAssetList';
import { type GlobalReceiveAssetSections } from '../globalReceiveAssetUtils';
import { GlobalReceiveNoResults } from './GlobalReceiveNoResults';
import { type GlobalReceiveAssetCatalogStatus } from '../hooks/useGlobalReceiveAssets';

const ItemSkeleton = () => (
    <Row gap={12}>
        <Skeleton type="circle" size={40} animate />
        <Column gap={6}>
            <Skeleton type="rectangle" width={200} height={15} animate />
            <Skeleton type="rectangle" width={150} height={10} animate />
        </Column>
        <Column gap={6} alignItems="flex-end" margin={{ left: 'auto' }}>
            <Skeleton type="rectangle" width={60} height={15} animate />
            <Skeleton type="rectangle" width={40} height={10} animate />
        </Column>
    </Row>
);

type GlobalReceiveAssetsTabProps = {
    assetSections: GlobalReceiveAssetSections;
    catalogStatus: GlobalReceiveAssetCatalogStatus;
    disabledMessage: TranslationKey | undefined;
    isAssetDisabled: (asset: TradingAssetOption) => boolean;
    listRef: RefObject<HTMLDivElement | null>;
    onAssetClick: (asset: TradingAssetOption) => void;
    onRetry: () => void;
};

export const GlobalReceiveAssetsTab = ({
    assetSections,
    catalogStatus,
    disabledMessage,
    isAssetDisabled,
    listRef,
    onAssetClick,
    onRetry,
}: GlobalReceiveAssetsTabProps) => {
    const isAssetListEmpty =
        assetSections.assetsWithBalance.length === 0 && assetSections.allAssets.length === 0;

    if (catalogStatus === 'loading') {
        return (
            <Column padding={16} gap={24}>
                {Array.from({ length: 10 }).map((_, index) => (
                    <ItemSkeleton key={index} />
                ))}
            </Column>
        );
    }

    if (catalogStatus === 'error') {
        return (
            <Column alignItems="center" gap={16} padding={{ vertical: 48 }}>
                <Paragraph typographyStyle="body-sm">
                    <Translation id="TR_DASHBOARD_ASSETS_ERROR" />
                </Paragraph>
                <Button intent="neutral" priority="secondary" onClick={onRetry}>
                    <Translation id="TR_RETRY" />
                </Button>
            </Column>
        );
    }

    if (isAssetListEmpty) {
        return <GlobalReceiveNoResults />;
    }

    return (
        <GlobalReceiveAssetList
            assetsWithBalance={assetSections.assetsWithBalance}
            allAssets={assetSections.allAssets}
            disabledMessage={disabledMessage}
            isAssetDisabled={isAssetDisabled}
            listRef={listRef}
            onAssetClick={onAssetClick}
        />
    );
};
