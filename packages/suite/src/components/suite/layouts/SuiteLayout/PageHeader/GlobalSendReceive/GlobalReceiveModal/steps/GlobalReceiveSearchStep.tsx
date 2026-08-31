import { useRef } from 'react';

import { Translation, type TranslationKey } from '@suite/intl';
import { type TradingAssetOption } from '@suite-common/trading';
import { type NetworkSymbol } from '@suite-common/wallet-config';
import { type Account } from '@suite-common/wallet-types';
import {
    Button,
    Column,
    H4,
    IconCircle,
    Link,
    Paragraph,
    Row,
    Skeleton,
    SubTabs,
    Text,
} from '@trezor/components';
import { PlusIcon } from '@trezor/icons';
import { HOW_TO_CHOOSE_RIGHT_NETWORK_URL } from '@trezor/urls';

import { AssetsModal } from 'src/components/suite/asset-picker/components';
import { ItemClickableContainer } from 'src/components/suite/asset-picker/components/AssetRow/ItemClickableContainer';

import { AssetSearchWithNetworkFilter } from '../../AssetSearchWithNetworkFilter/AssetSearchWithNetworkFilter';
import { GlobalReceiveAccountListItem } from '../components/GlobalReceiveAccountListItem';
import { GlobalReceiveAssetList } from '../components/GlobalReceiveAssetList';
import { GLOBAL_RECEIVE_LIST_HEIGHT } from '../constants';
import { type GlobalReceiveAssetSections } from '../globalReceiveAssetUtils';
import { type AccountOption } from '../hooks/useAccountsOptions';
import { type GlobalReceiveAssetCatalogStatus } from '../hooks/useGlobalReceiveAssets';
import { type GlobalReceiveTab } from '../types';

const NoResults = () => (
    <Column
        height={GLOBAL_RECEIVE_LIST_HEIGHT}
        width="100%"
        maxWidth={380}
        alignSelf="center"
        alignItems="center"
        justifyContent="center"
        // Adjust for optical center.
        padding={{ bottom: 16 }}
    >
        <H4 typographyStyle="body-md" align="center">
            <Translation id="TR_GLOBAL_RECEIVE_NO_RESULTS" />
        </H4>
        <Paragraph typographyStyle="body-sm" priority="secondary" intent="neutral" align="center">
            <Translation id="TR_GLOBAL_RECEIVE_NO_RESULTS_DESCRIPTION" />
        </Paragraph>
    </Column>
);

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

type GlobalReceiveSearchStepProps = {
    activeTab: GlobalReceiveTab;
    assetDisabledMessage: TranslationKey | undefined;
    assetSections: GlobalReceiveAssetSections;
    assetNetworks: NetworkSymbol[];
    accountNetworks: NetworkSymbol[];
    catalogStatus: GlobalReceiveAssetCatalogStatus;
    filledSearch: boolean;
    filteredAccountOptions: AccountOption[];
    isAddAccountDisabled: boolean;
    isAssetDisabled: (asset: TradingAssetOption) => boolean;
    onAccountClick: (account: Account) => void;
    onAddAccountClick: () => void;
    onAssetClick: (asset: TradingAssetOption) => void;
    onCancel: () => void;
    onRetry: () => void;
    onTabChange: (tab: GlobalReceiveTab) => void;
};

export const GlobalReceiveSearchStep = ({
    activeTab,
    assetDisabledMessage,
    assetSections,
    assetNetworks,
    accountNetworks,
    catalogStatus,
    filteredAccountOptions,
    isAddAccountDisabled,
    isAssetDisabled,
    onAccountClick,
    onAddAccountClick,
    onAssetClick,
    onCancel,
    onRetry,
    onTabChange,
}: GlobalReceiveSearchStepProps) => {
    const listRef = useRef<HTMLDivElement>(null);
    const isAssetListEmpty =
        assetSections.assetsWithBalance.length === 0 && assetSections.allAssets.length === 0;

    return (
        <AssetsModal
            heading={<Translation id="TR_RECEIVE" />}
            description={
                <Translation
                    id="TR_GLOBAL_RECEIVE_DESCRIPTION"
                    values={{
                        a: (...chunks) => (
                            <Link href={HOW_TO_CHOOSE_RIGHT_NETWORK_URL}>{chunks}</Link>
                        ),
                    }}
                />
            }
            onClose={onCancel}
            height={670}
            data-testid="@global-receive/modal"
        >
            <Column gap={8}>
                <Column gap={16} padding={{ horizontal: 16 }}>
                    <AssetSearchWithNetworkFilter
                        placeholder={
                            activeTab === 'assets'
                                ? 'TR_GLOBAL_RECEIVE_SEARCH_ASSETS'
                                : 'TR_RECEIVE_SEARCH'
                        }
                        listRef={listRef}
                        modal="receive"
                        networks={activeTab === 'assets' ? assetNetworks : accountNetworks}
                        shouldResetSearchOnNetworkChange={false}
                    />
                    <SubTabs activeItemId={activeTab}>
                        <SubTabs.Item
                            id="assets"
                            data-testid="@global-receive/tab/assets"
                            onClick={() => onTabChange('assets')}
                        >
                            <Translation id="TR_GLOBAL_RECEIVE_ASSETS_TAB" />
                        </SubTabs.Item>
                        <SubTabs.Item
                            id="accounts"
                            data-testid="@global-receive/tab/accounts"
                            onClick={() => onTabChange('accounts')}
                        >
                            <Translation id="TR_GLOBAL_RECEIVE_ACCOUNTS_TAB" />
                        </SubTabs.Item>
                    </SubTabs>
                </Column>

                {activeTab === 'assets' && (
                    <>
                        {catalogStatus === 'loading' && (
                            <Column padding={16} gap={24}>
                                {Array.from({ length: 10 }).map((_, index) => (
                                    <ItemSkeleton key={index} />
                                ))}
                            </Column>
                        )}
                        {catalogStatus === 'error' && (
                            <Column alignItems="center" gap={16} padding={{ vertical: 48 }}>
                                <Paragraph typographyStyle="body-sm">
                                    <Translation id="TR_DASHBOARD_ASSETS_ERROR" />
                                </Paragraph>
                                <Button intent="neutral" priority="secondary" onClick={onRetry}>
                                    <Translation id="TR_RETRY" />
                                </Button>
                            </Column>
                        )}
                        {catalogStatus === 'ready' && isAssetListEmpty && <NoResults />}
                        {catalogStatus === 'ready' && !isAssetListEmpty && (
                            <GlobalReceiveAssetList
                                assetsWithBalance={assetSections.assetsWithBalance}
                                allAssets={assetSections.allAssets}
                                disabledMessage={assetDisabledMessage}
                                isAssetDisabled={isAssetDisabled}
                                listRef={listRef}
                                onAssetClick={onAssetClick}
                            />
                        )}
                    </>
                )}

                {activeTab === 'accounts' &&
                    (filteredAccountOptions.length > 0 ? (
                        <Column padding={{ horizontal: 8, vertical: 8 }}>
                            {filteredAccountOptions.map(({ account }) => (
                                <GlobalReceiveAccountListItem
                                    key={account.key}
                                    account={account}
                                    dataTestId={`@global-receive-account/${account.accountType}/${account.symbol}/${account.index}`}
                                    onClick={onAccountClick}
                                    variant="plain"
                                />
                            ))}
                            {!isAddAccountDisabled && (
                                <ItemClickableContainer onClick={onAddAccountClick}>
                                    <Row gap={12} data-testid="@global-send-receive/add-account">
                                        <IconCircle icon={PlusIcon} size={40} intent="neutral" />
                                        <Text typographyStyle="body-md">
                                            <Translation id="TR_ADD_ACCOUNT" />
                                        </Text>
                                    </Row>
                                </ItemClickableContainer>
                            )}
                        </Column>
                    ) : (
                        <NoResults />
                    ))}
            </Column>
        </AssetsModal>
    );
};
