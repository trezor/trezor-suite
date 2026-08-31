import { type RefObject, useMemo } from 'react';
import { useSelector } from 'react-redux';

import { useDevice } from '@suite/device';
import { Translation, type TranslationKey } from '@suite/intl';
import { type TradeableAssetBalances, type TradingAssetOption } from '@suite-common/trading';
import { Button, Column, H4, Link, Paragraph, Row, Skeleton } from '@trezor/components';

import { useDiscovery } from 'src/hooks/suite';
import { globalSendReceiveFiltersSelectors } from 'src/slices/wallet/globalSendReceiveFilters';

import { GlobalReceiveAssetList } from '../components/GlobalReceiveAssetList';
import { GLOBAL_RECEIVE_LIST_HEIGHT } from '../constants';
import {
    buildGlobalReceiveAssetSearchIndex,
    getGlobalReceiveAssetSections,
} from '../globalReceiveAssetUtils';
import { type GlobalReceiveAssetCatalogStatus } from '../hooks/useGlobalReceiveAssets';

const getAssetDisabledMessage = (
    isDeviceConnected: boolean | undefined,
    isDiscoveryRunning: boolean,
): TranslationKey | undefined => {
    if (isDeviceConnected === false) {
        return 'TR_TO_ADD_NEW_ACCOUNT_PLEASE_CONNECT';
    }

    if (isDiscoveryRunning) {
        return 'TR_TO_ADD_NEW_ACCOUNT_WAIT_FOR_DISCOVERY';
    }
};

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
    assets: TradingAssetOption[];
    balances: TradeableAssetBalances;
    catalogStatus: GlobalReceiveAssetCatalogStatus;
    isAssetDisabled: (asset: TradingAssetOption) => boolean;
    listRef: RefObject<HTMLDivElement | null>;
    onAssetClick: (asset: TradingAssetOption) => void;
    onRetry: () => void;
    onViewAccountsClick: () => void;
};

export const GlobalReceiveAssetsTab = ({
    assets,
    balances,
    catalogStatus,
    isAssetDisabled,
    listRef,
    onAssetClick,
    onRetry,
    onViewAccountsClick,
}: GlobalReceiveAssetsTabProps) => {
    const search = useSelector(globalSendReceiveFiltersSelectors.selectSearch);
    const selectedNetworkSymbol = useSelector(
        globalSendReceiveFiltersSelectors.selectNetworkSymbol,
    );

    const { device } = useDevice();
    const { isDiscoveryRunning } = useDiscovery();
    const assetSearchIndex = useMemo(() => buildGlobalReceiveAssetSearchIndex(assets), [assets]);
    const assetSections = useMemo(
        () =>
            getGlobalReceiveAssetSections({
                assets,
                balances,
                search,
                searchIndex: assetSearchIndex,
                networkSymbol: selectedNetworkSymbol,
            }),
        [assetSearchIndex, assets, balances, search, selectedNetworkSymbol],
    );
    const disabledMessage = getAssetDisabledMessage(device?.connected, isDiscoveryRunning);
    const isAssetListEmpty =
        assetSections.assetsWithBalance.length === 0 &&
        assetSections.assetsWithoutBalance.length === 0;

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
            assetsWithoutBalance={assetSections.assetsWithoutBalance}
            disabledMessage={disabledMessage}
            isAssetDisabled={isAssetDisabled}
            listRef={listRef}
            onAssetClick={onAssetClick}
        />
    );
};
