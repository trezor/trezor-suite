import { type ReactElement, useRef, useState } from 'react';

import { useExternalLink } from '@suite/external-links';
import { Translation } from '@suite/intl';
import { gotoThunk } from '@suite/router';
import {
    selectWalletAssetAccountCount,
    selectWalletAssetContractAddress,
    selectWalletAssetHiddenReason,
    selectWalletAssetSymbol,
} from '@suite-common/assets';
import {
    DefinitionType,
    TokenManagementAction,
    tokenDefinitionsActions,
} from '@suite-common/token-definitions';
import { getNetwork } from '@suite-common/wallet-config';
import { type WalletAssetKey } from '@suite-common/wallet-core';
import { type Account, type AddressType } from '@suite-common/wallet-types';
import {
    Column,
    Divider,
    Dropdown,
    type DropdownMenuItemProps,
    type DropdownRef,
    Icon,
    Row,
    Text,
} from '@trezor/components';
import { useServices } from '@trezor/dependency-injection';
import {
    ArrowUpRightIcon,
    CaretRightIcon,
    EyeIcon,
    EyeSlashIcon,
    LinkIcon,
    ShieldWarningIcon,
    WalletIcon,
} from '@trezor/icons';
import { injectDispatch } from '@trezor/redux-utils';

import { useSelector } from 'src/hooks/suite';
import { getTokenAddressTranslationId } from 'src/utils/wallet/tokenUtils';
import { UnhideAssetModal } from 'src/views/dashboard/HiddenTokens/UnhideAssetModal';
import { AssetDetailAccountsModal } from 'src/views/home/AssetDetail/AssetDetailModals/AssetDetailAccountsModal';
import { AssetDetailSignVerifyModal } from 'src/views/home/AssetDetail/AssetDetailModals/AssetDetailSignVerifyModal';

import { AssetDetailMenuAddressField } from './AssetDetailMenuAddressField';
import { AssetDetailMenuNetworkRow } from './AssetDetailMenuNetworkRow';
import {
    selectWalletAssetExplorerUrl,
    selectWalletAssetSignVerifyAccounts,
    selectWalletAssetTokenInfo,
} from './assetDetailMenuSelectors';
import { getAssetAddressFields } from './getAssetAddressFields';

type AssetDetailMenuProps = {
    assetKey: WalletAssetKey;
};

export const AssetDetailMenu = ({ assetKey }: AssetDetailMenuProps) => {
    const { dispatch } = useServices(injectDispatch);
    const symbol = useSelector(state => selectWalletAssetSymbol(state, assetKey));
    const contractAddress = useSelector(state => selectWalletAssetContractAddress(state, assetKey));
    const accountCount = useSelector(state => selectWalletAssetAccountCount(state, assetKey));
    const tokenInfo = useSelector(state => selectWalletAssetTokenInfo(state, assetKey));
    const hiddenReason = useSelector(state => selectWalletAssetHiddenReason(state, assetKey));
    const signVerifyAccounts = useSelector(state =>
        selectWalletAssetSignVerifyAccounts(state, assetKey),
    );
    const explorerUrl = useExternalLink(
        useSelector(state => selectWalletAssetExplorerUrl(state, assetKey)),
    );
    const dropdownRef = useRef<DropdownRef>(null);
    const [isUnhideModalOpen, setIsUnhideModalOpen] = useState(false);
    const [isAccountsModalOpen, setIsAccountsModalOpen] = useState(false);
    const [isSignVerifyModalOpen, setIsSignVerifyModalOpen] = useState(false);

    if (symbol === undefined) {
        return null;
    }

    const closeMenu = () => dropdownRef.current?.close();

    const addressFieldLabels: Record<AddressType, ReactElement> = {
        contract: <Translation id={getTokenAddressTranslationId(getNetwork(symbol).networkType)} />,
        fingerprint: <Translation id="TR_CARDANO_FINGERPRINT_HEADLINE" />,
        policyId: <Translation id="TR_ASSET_DETAIL_POLICY_ID" />,
    };

    const goToSignVerify = (account: Account) => {
        setIsSignVerifyModalOpen(false);
        dispatch(
            gotoThunk({
                routeName: 'wallet-sign-verify',
                params: {
                    symbol: account.symbol,
                    accountIndex: account.index,
                    accountType: account.accountType,
                },
            }),
        );
    };

    const startSignVerify = () => {
        const [onlyAccount] = signVerifyAccounts;

        if (signVerifyAccounts.length === 1 && onlyAccount !== undefined) {
            goToSignVerify(onlyAccount);

            return;
        }

        setIsSignVerifyModalOpen(true);
    };

    const goToConnectedApps = () => dispatch(gotoThunk({ routeName: 'settings-connected-apps' }));

    const setTokenStatus = (status: TokenManagementAction) => {
        if (contractAddress === undefined) {
            return;
        }

        dispatch(
            tokenDefinitionsActions.setTokenStatus({
                symbol,
                contractAddress,
                status,
                type: DefinitionType.COIN,
            }),
        );
    };

    const showToken = () => {
        if (hiddenReason === 'unrecognized') {
            setIsUnhideModalOpen(true);

            return;
        }

        setTokenStatus(TokenManagementAction.SHOW);
    };

    const openExplorer = () => window.open(explorerUrl, '_blank');

    const addressFields = getAssetAddressFields(tokenInfo);

    const items: DropdownMenuItemProps[] = [
        {
            label: <Translation id="TR_ASSET_DETAIL_ACCOUNTS" />,
            icon: WalletIcon,
            rightContent: (
                <Row gap={4}>
                    <Text intent="neutral" priority="secondary">
                        {accountCount}
                    </Text>
                    <Icon as={CaretRightIcon} size={16} intent="neutral" />
                </Row>
            ),
            onClick: () => setIsAccountsModalOpen(true),
            'data-testid': '@asset-detail/menu/accounts',
        },
        {
            label: <Translation id="TR_NAV_SIGN_AND_VERIFY" />,
            icon: ShieldWarningIcon,
            onClick: startSignVerify,
            isHidden: signVerifyAccounts.length === 0,
            'data-testid': '@asset-detail/menu/sign-verify',
        },
        {
            label: <Translation id="TR_WALLETCONNECT" />,
            icon: LinkIcon,
            onClick: goToConnectedApps,
            isHidden: getNetwork(symbol).caipId === undefined,
            'data-testid': '@asset-detail/menu/walletconnect',
        },
        {
            label: <Translation id="TR_HIDE_TOKEN" />,
            icon: EyeSlashIcon,
            onClick: () => setTokenStatus(TokenManagementAction.HIDE),
            isHidden: contractAddress === undefined || hiddenReason !== undefined,
            'data-testid': '@asset-detail/menu/hide-token',
        },
        {
            label: <Translation id="TR_UNHIDE_TOKEN" />,
            icon: EyeIcon,
            onClick: showToken,
            isHidden: hiddenReason === undefined,
            'data-testid': '@asset-detail/menu/show-token',
        },
        {
            label: <Translation id="TR_VIEW_IN_EXPLORER" />,
            icon: ArrowUpRightIcon,
            onClick: openExplorer,
            isHidden: explorerUrl === undefined,
            hasSeparatorBefore: true,
            'data-testid': '@asset-detail/menu/explorer',
        },
    ];

    return (
        <>
            <Dropdown
                ref={dropdownRef}
                placement={{ position: 'bottom', alignment: 'end' }}
                tooltip={{ content: <Translation id="TR_SHOW_MORE" /> }}
                minWidth={280}
                content={
                    <Column alignItems="stretch">
                        <AssetDetailMenuNetworkRow symbol={symbol} />
                        <Divider margin={{ top: 8, bottom: 0 }} />
                        {addressFields.length > 0 && (
                            <>
                                {addressFields.map(field => (
                                    <AssetDetailMenuAddressField
                                        key={field.type}
                                        field={field}
                                        label={addressFieldLabels[field.type]}
                                        onCopy={closeMenu}
                                    />
                                ))}
                                <Divider margin={{ top: 8, bottom: 0 }} />
                            </>
                        )}
                    </Column>
                }
                items={items}
                data-testid="@asset-detail/menu"
            />
            {isSignVerifyModalOpen && (
                <AssetDetailSignVerifyModal
                    symbol={symbol}
                    accounts={signVerifyAccounts}
                    onAccountClick={goToSignVerify}
                    onClose={() => setIsSignVerifyModalOpen(false)}
                />
            )}
            {isAccountsModalOpen && (
                <AssetDetailAccountsModal
                    assetKey={assetKey}
                    onClose={() => setIsAccountsModalOpen(false)}
                />
            )}
            {isUnhideModalOpen && hiddenReason !== undefined && (
                <UnhideAssetModal
                    assetKey={assetKey}
                    reason={hiddenReason}
                    onCancel={() => setIsUnhideModalOpen(false)}
                />
            )}
        </>
    );
};
