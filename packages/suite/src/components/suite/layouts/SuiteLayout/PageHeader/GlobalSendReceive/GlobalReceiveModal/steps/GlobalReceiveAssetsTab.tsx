import { type RefObject } from 'react';

import { Translation, type TranslationKey } from '@suite/intl';
import { type TradingAssetOption } from '@suite-common/trading';
import { Button, Column, H4, Link, Paragraph, Row, Skeleton } from '@trezor/components';

import { GlobalReceiveAssetList } from '../components/GlobalReceiveAssetList';
import { GLOBAL_RECEIVE_LIST_HEIGHT } from '../constants';
import { type GlobalReceiveAssetSections } from '../globalReceiveAssetUtils';
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

const AssetsNoResults = ({ onViewAccountsClick }: { onViewAccountsClick: () => void }) => (
    <Column
        height={GLOBAL_RECEIVE_LIST_HEIGHT}
        width="100%"
        maxWidth={380}
        alignSelf="center"
        alignItems="center"
        justifyContent="center"
        gap={8}
        // Adjust for optical center.
        padding={{ bottom: 16 }}
    >
        <H4 typographyStyle="body-md" align="center">
            <Translation id="TR_GLOBAL_RECEIVE_NO_RESULTS" />
        </H4>
        <Paragraph typographyStyle="body-sm" priority="secondary" intent="neutral" align="center">
            <Translation id="TR_GLOBAL_RECEIVE_NO_ASSETS_RESULTS_DESCRIPTION" />
        </Paragraph>
        <Link onClick={onViewAccountsClick}>
            <Translation id="TR_GLOBAL_RECEIVE_VIEW_ACCOUNTS" />
        </Link>
    </Column>
);

type GlobalReceiveAssetsTabProps = {
    assetSections: GlobalReceiveAssetSections;
    catalogStatus: GlobalReceiveAssetCatalogStatus;
    disabledMessage: TranslationKey | undefined;
    isAssetDisabled: (asset: TradingAssetOption) => boolean;
    listRef: RefObject<HTMLDivElement | null>;
    onAssetClick: (asset: TradingAssetOption) => void;
    onRetry: () => void;
    onViewAccountsClick: () => void;
};

export const GlobalReceiveAssetsTab = ({
    assetSections,
    catalogStatus,
    disabledMessage,
    isAssetDisabled,
    listRef,
    onAssetClick,
    onRetry,
    onViewAccountsClick,
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
        return <AssetsNoResults onViewAccountsClick={onViewAccountsClick} />;
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
