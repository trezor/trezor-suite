import { useRef } from 'react';

import { Translation } from '@suite/intl';
import { type TradingAssetOption } from '@suite-common/trading';
import { type NetworkSymbol } from '@suite-common/wallet-config';
import { type Account } from '@suite-common/wallet-types';
import {
    Button,
    Column,
    IconCircle,
    Link,
    Paragraph,
    Row,
    Spinner,
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
import { type GlobalReceiveAssetSections } from '../globalReceiveAssetUtils';
import { type FilteredAccountOption } from '../hooks/useFilterAccounts';
import { type GlobalReceiveAssetCatalogStatus } from '../hooks/useGlobalReceiveAssets';
import { type GlobalReceiveTab } from '../types';

type GlobalReceiveSearchStepProps = {
    activeTab: GlobalReceiveTab;
    assetSections: GlobalReceiveAssetSections;
    assetNetworks: NetworkSymbol[];
    accountNetworks: NetworkSymbol[];
    catalogStatus: GlobalReceiveAssetCatalogStatus;
    filledSearch: boolean;
    filteredAccountOptions: FilteredAccountOption[];
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
    assetSections,
    assetNetworks,
    accountNetworks,
    catalogStatus,
    filledSearch,
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
            maxHeight={670}
            data-testid="@global-receive/modal"
        >
            <Column gap={16}>
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
                            <Column alignItems="center" padding={{ vertical: 48 }}>
                                <Spinner size={48} />
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
                        {catalogStatus === 'ready' && isAssetListEmpty && (
                            <Paragraph
                                typographyStyle="body-sm"
                                align="center"
                                padding={{ vertical: 48 }}
                            >
                                <Translation id="TR_GLOBAL_RECEIVE_NO_ASSETS" />
                            </Paragraph>
                        )}
                        {catalogStatus === 'ready' && !isAssetListEmpty && (
                            <GlobalReceiveAssetList
                                assetsWithBalance={assetSections.assetsWithBalance}
                                allAssets={assetSections.allAssets}
                                isAssetDisabled={isAssetDisabled}
                                listRef={listRef}
                                onAssetClick={onAssetClick}
                            />
                        )}
                    </>
                )}

                {activeTab === 'accounts' && (
                    <Column ref={listRef} padding={{ horizontal: 8, bottom: 8 }}>
                        {filteredAccountOptions.length === 0 && (
                            <Paragraph
                                typographyStyle="body-sm"
                                align="center"
                                padding={{ vertical: 24 }}
                            >
                                <Translation
                                    id={
                                        filledSearch
                                            ? 'TR_ACCOUNT_SEARCH_NO_RESULTS'
                                            : 'TR_ACCOUNT_NO_ACCOUNTS'
                                    }
                                />
                            </Paragraph>
                        )}
                        {(filteredAccountOptions.length > 0 || !isAddAccountDisabled) && (
                            <>
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
                                        <Row
                                            gap={12}
                                            data-testid="@global-send-receive/add-account"
                                        >
                                            <IconCircle
                                                icon={PlusIcon}
                                                size={40}
                                                intent="neutral"
                                            />
                                            <Text typographyStyle="body-md">
                                                <Translation id="TR_ADD_ACCOUNT" />
                                            </Text>
                                        </Row>
                                    </ItemClickableContainer>
                                )}
                            </>
                        )}
                    </Column>
                )}
            </Column>
        </AssetsModal>
    );
};
