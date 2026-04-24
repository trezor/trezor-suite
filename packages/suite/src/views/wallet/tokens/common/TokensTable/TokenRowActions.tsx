import { type ReactNode } from 'react';

import { events } from '@suite/analytics';
import { useDevice } from '@suite/device';
import { selectIsCopyAddressModalShown, selectIsUnhideTokenModalShown } from '@suite/flags';
import { Translation } from '@suite/intl';
import { openModal } from '@suite/modal';
import { goto } from '@suite/router';
import { selectSelectedDevice } from '@suite-common/device';
import { type YieldDto } from '@suite-common/earn-stablecoin-api';
import {
    DefinitionType,
    type EnhancedTokenInfo,
    TokenManagementAction,
    tokenDefinitionsActions,
} from '@suite-common/token-definitions';
import {
    type TradingType,
    getTradingPrefilledFromAccountData,
    getUnusedAddressFromAccount,
    selectTradingInfo,
    toTokenCryptoId,
    tradingActions,
} from '@suite-common/trading';
import { type Explorer, type Network } from '@suite-common/wallet-config';
import { selectExplorer, sendFormActions } from '@suite-common/wallet-core';
import { type Account } from '@suite-common/wallet-types';
import {
    getContractAddressForNetworkSymbol,
    getTokenExplorerUrl,
    isErc4626,
} from '@suite-common/wallet-utils';
import {
    Button,
    ButtonGroup,
    Card,
    Column,
    Dropdown,
    IconButton,
    InfoItem,
    Link,
    Row,
    Tooltip,
} from '@trezor/components';

import { SUITE } from 'src/actions/suite/constants';
import { copyAddressToClipboard, showCopyAddressModal } from 'src/actions/suite/copyAddressActions';
import { setSendFormPrefill } from 'src/actions/suite/suiteActions';
import { showAddress } from 'src/actions/wallet/receiveActions';
import { getEarnRouteParams } from 'src/components/earn/utils/getEarnRouteParams';
import { Address } from 'src/components/suite';
import { useDispatch, useExternalLink, useLayoutSize, useSelector } from 'src/hooks/suite';
import { selectIsDeviceCompromised } from 'src/selectors/suite/suiteAuthenticityChecksSelectors';
import { useAnalytics } from 'src/support/useAnalytics';
import { getTokenAddressTranslationId } from 'src/utils/wallet/tokenUtils';

import type { TokensTableType } from './types';

interface TokenRowBasicActionsProps {
    type?: TokensTableType;
    token: EnhancedTokenInfo;
    tokenStatusType: TokenManagementAction;
    account: Account;
    network: Network;
    isUnverifiedTable?: boolean;
    yieldOpportunities?: YieldDto[];
    setShowDeactivateModal: (value: boolean) => void;
}

const TokenRowBasicActions = ({
    type = 'default',
    token,
    tokenStatusType,
    account,
    network,
    isUnverifiedTable,
    yieldOpportunities,
    setShowDeactivateModal,
}: TokenRowBasicActionsProps) => {
    const dispatch = useDispatch();
    const analytics = useAnalytics();
    const device = useSelector(selectSelectedDevice);
    const { isLocked } = useDevice();
    const { isBelowTablet } = useLayoutSize();

    const shouldShowCopyAddressModal = useSelector(selectIsCopyAddressModalShown);
    const shouldShowUnhideTokenModal = useSelector(selectIsUnhideTokenModalShown);

    const { address: unusedAddress, path } = getUnusedAddressFromAccount(account);

    const { coins } = useSelector(selectTradingInfo);
    const isDeviceLocked = isLocked(true);
    const isDeviceCompromised = useSelector(selectIsDeviceCompromised);

    const explorer = useSelector(state => selectExplorer(state, network.symbol)) as Explorer;
    const explorerUrl = useExternalLink(getTokenExplorerUrl(explorer, network.networkType, token));

    const contractAddress = getContractAddressForNetworkSymbol(account.symbol, token.contract);
    const tokenCryptoId = toTokenCryptoId(account.symbol, contractAddress);
    const tokenTradingOptions = coins?.[tokenCryptoId]?.services;

    const canBuyToken = !!tokenTradingOptions && tokenTradingOptions.buy;
    const canSwapToken =
        (!!tokenTradingOptions && tokenTradingOptions.exchange) || token.balance === '0';
    const canSellToken = !!tokenTradingOptions && tokenTradingOptions.sell;
    const canReceiveToken = !isDeviceLocked && !isDeviceCompromised;

    const availableVault = yieldOpportunities?.find(
        vault =>
            !vault.metadata.underMaintenance &&
            !vault.metadata.deprecated &&
            vault.outputToken?.address !== undefined &&
            getContractAddressForNetworkSymbol(account.symbol, vault.outputToken.address) ===
                getContractAddressForNetworkSymbol(account.symbol, token.contract),
    );

    const isSupplyButtonDisabled = !availableVault || !availableVault.status.enter;
    const isWithdrawButtonDisabled = !availableVault || !availableVault.status.exit;

    if (!unusedAddress || !device) return null;

    const goToWithAnalytics = (...[payload]: Parameters<typeof goto>) => {
        if (network.networkType) {
            analytics.report({
                type: events.accountsActionsEvent.name,
                payload: { symbol: network.symbol, action: payload.routeName },
            });
        }
        dispatch(goto(payload));
    };

    const navigateToYieldSupply = () => {
        if (!availableVault) return;

        const yieldId = availableVault.id;
        const contractAddress = availableVault.token.address;

        dispatch(
            goto({
                routeName: 'earn-supply',
                params: getEarnRouteParams({
                    account,
                    yieldId,
                    contractAddress,
                }),
            }),
        );
    };

    const navigateToYieldWithdraw = () => {
        if (!availableVault) return;

        const yieldId = availableVault.id;
        const contractAddress = availableVault.token.address;

        dispatch(
            goto({
                routeName: 'earn-withdraw',
                params: getEarnRouteParams({
                    account,
                    yieldId,
                    contractAddress,
                }),
            }),
        );
    };

    const onTradeButtonClick = (type: TradingType, ...[payload]: Parameters<typeof goto>) => {
        dispatch(
            tradingActions.setTradingFromPrefilledAccount(
                getTradingPrefilledFromAccountData(account, tokenCryptoId),
            ),
        );

        goToWithAnalytics(payload);

        analytics.report({
            type: events.tradeNavigateEvent.name,
            payload: {
                action: 'navigate',
                type,
                from: 'account/tokens',
                networkSymbol: account.symbol,
                contractAddress: token.contract,
            },
        });
    };

    const onBuyButtonClick = () => {
        onTradeButtonClick('buy', {
            routeName: 'wallet-trading-buy',
        });
    };

    const onSellButtonClick = () => {
        onTradeButtonClick('sell', {
            routeName: 'wallet-trading-sell',
        });
    };

    const onSwapButtonClick = () => {
        onTradeButtonClick('exchange', {
            routeName: 'wallet-trading-exchange',
        });
    };

    const onSendButtonClick = () => {
        dispatch(
            setSendFormPrefill({
                contractAddress: token.contract,
            }),
        );
        dispatch(
            sendFormActions.removeDraft({
                accountKey: account.key,
            }),
        );

        goToWithAnalytics({
            routeName: 'wallet-send',
            params: {
                symbol: account.symbol,
                accountIndex: account.index,
                accountType: account.accountType,
            },
        });
    };

    const onReceiveButtonClick = () => {
        if (network.networkType === 'cardano') {
            goToWithAnalytics({ routeName: 'wallet-receive', preserveParams: true });
        } else {
            dispatch(showAddress(path, unusedAddress));
        }
    };

    const onShowHideButtonClick = () => {
        dispatch(
            tokenDefinitionsActions.setTokenStatus({
                symbol: network.symbol,
                contractAddress: token.contract,
                status: tokenStatusType,
                type: DefinitionType.COIN,
            }),
        );
    };

    const onViewAllTransactionsButtonClick = () => {
        dispatch({
            type: SUITE.SET_TRANSACTION_HISTORY_PREFILL,
            payload: token.contract,
        });

        goToWithAnalytics({
            routeName: 'wallet-index',
            params: {
                symbol: account.symbol,
                accountIndex: account.index,
                accountType: account.accountType,
            },
        });
    };

    const onViewInExplorerButtonClick = () => {
        window.open(explorerUrl, '_blank');
    };

    const onDeactivateTokenButtonClick = () => {
        setShowDeactivateModal(true);
    };

    const TokenAddressItem = ({
        label,
        address,
        type,
    }: {
        label: ReactNode;
        address: string;
        type: 'contract' | 'fingerprint' | 'policyId';
    }) => (
        <InfoItem typographyStyle="body-xs" label={label} gap={0}>
            <Link href={explorerUrl}>
                <Address
                    isTruncated
                    typographyStyle="body-xs"
                    value={address}
                    isCopyAllowed
                    onCopy={() => {
                        dispatch(
                            shouldShowCopyAddressModal
                                ? showCopyAddressModal(address, type)
                                : copyAddressToClipboard(address),
                        );
                    }}
                />
            </Link>
        </InfoItem>
    );

    return (
        <Row gap={8}>
            <Dropdown
                placement={{ position: 'bottom', alignment: 'start' }}
                content={
                    <Card paddingType="small">
                        <Column gap={16}>
                            {!token.policyId && (
                                <TokenAddressItem
                                    label={
                                        <Translation
                                            id={getTokenAddressTranslationId(network.networkType)}
                                        />
                                    }
                                    address={token.contract}
                                    type="contract"
                                />
                            )}
                            {token.fingerprint && (
                                <TokenAddressItem
                                    label={<Translation id="TR_FINGERPRINT_ADDRESS" />}
                                    address={token.fingerprint}
                                    type="fingerprint"
                                />
                            )}
                            {token.policyId && (
                                <TokenAddressItem
                                    label={<Translation id="TR_POLICY_ID_ADDRESS" />}
                                    address={token.policyId}
                                    type="policyId"
                                />
                            )}
                        </Column>
                    </Card>
                }
                items={[
                    {
                        label: <Translation id="TR_BUY" />,
                        'data-testid': '@trading/tokens/buy-button',
                        icon: 'currencyCircleDollar',
                        onClick: onBuyButtonClick,
                        isDisabled: !canBuyToken,
                    },
                    {
                        label: <Translation id="TR_TRADING_SELL" />,
                        'data-testid': '@trading/tokens/sell-button',
                        icon: 'currencyCircleDollar',
                        onClick: onSellButtonClick,
                        isDisabled: token.balance === '0' || !canSellToken,
                    },
                    {
                        label: <Translation id="TR_TRADING_SWAP" />,
                        'data-testid': '@trading/tokens/swap-button',
                        icon: 'arrowsLeftRight',
                        onClick: onSwapButtonClick,
                        isHidden: type === 'defi' ? false : !isBelowTablet,
                        isDisabled: !canSwapToken,
                    },
                    {
                        label: <Translation id="TR_NAV_RECEIVE" />,
                        'data-testid': '@trading/tokens/receive-button',
                        icon: 'arrowDown',
                        onClick: onReceiveButtonClick,
                        isDisabled: !canReceiveToken,
                        isHidden:
                            type !== 'defi' &&
                            (tokenStatusType === TokenManagementAction.HIDE
                                ? !isBelowTablet
                                : true),
                    },
                    {
                        label: <Translation id="TR_NAV_SEND" />,
                        'data-testid': '@trading/tokens/send-button',
                        icon: 'arrowUp',
                        onClick: onSendButtonClick,
                        isDisabled: token.balance === '0',
                        isHidden:
                            type !== 'defi' &&
                            (tokenStatusType === TokenManagementAction.HIDE
                                ? !isBelowTablet
                                : true),
                    },
                    {
                        label: <Translation id="TR_EARN_YIELD_SUPPLY" />,
                        icon: 'plus',
                        onClick: () => {},
                        isDisabled: type === 'defi' ? isSupplyButtonDisabled : true,
                        isHidden: type === 'defi' ? !isBelowTablet : !isErc4626(token),
                    },
                    {
                        label: <Translation id="TR_EARN_YIELD_WITHDRAW" />,
                        icon: 'minus',
                        onClick: () => {},
                        isDisabled: type === 'defi' ? isWithdrawButtonDisabled : true,
                        isHidden: type === 'defi' ? !isBelowTablet : !isErc4626(token),
                    },
                    {
                        label: (
                            <Translation
                                id={
                                    tokenStatusType === TokenManagementAction.SHOW
                                        ? 'TR_UNHIDE_TOKEN'
                                        : 'TR_HIDE_TOKEN'
                                }
                            />
                        ),
                        icon: 'eyeSlash',
                        onClick: onShowHideButtonClick,
                        isHidden: tokenStatusType === TokenManagementAction.SHOW && !isBelowTablet,
                    },
                    {
                        label: <Translation id="TR_VIEW_ALL_TRANSACTION" />,
                        'data-testid': '@trading/tokens/transactions-button',
                        icon: 'newspaper',
                        onClick: onViewAllTransactionsButtonClick,
                    },
                    {
                        label: <Translation id="TR_VIEW_IN_EXPLORER" />,
                        icon: 'arrowUpRight',
                        onClick: onViewInExplorerButtonClick,
                    },
                    {
                        label: <Translation id="TR_DEACTIVATE_TOKEN" />,
                        icon: 'x',
                        onClick: onDeactivateTokenButtonClick,
                        // Only show for Stellar tokens
                        isHidden: network.networkType !== 'stellar',
                    },
                ]}
            />

            {type !== 'defi' && !isBelowTablet && (
                <Tooltip
                    content={
                        canSwapToken ? (
                            <Translation id="TR_TRADING_SWAP" />
                        ) : (
                            <Translation id="TR_TRADING_SWAP_UNAVAILABLE" />
                        )
                    }
                >
                    <IconButton
                        isDisabled={!canSwapToken}
                        key="swap"
                        intent="neutral"
                        priority="secondary"
                        icon="arrowsLeftRight"
                        onClick={onSwapButtonClick}
                    />
                </Tooltip>
            )}

            {!isBelowTablet &&
                (tokenStatusType === TokenManagementAction.SHOW ? (
                    <Button
                        iconLeft="eye"
                        onClick={() =>
                            isUnverifiedTable && shouldShowUnhideTokenModal
                                ? dispatch(
                                      openModal({
                                          type: 'unhide-token',
                                          address: token.contract,
                                      }),
                                  )
                                : dispatch(
                                      tokenDefinitionsActions.setTokenStatus({
                                          symbol: network.symbol,
                                          contractAddress: token.contract,
                                          status: TokenManagementAction.SHOW,
                                          type: DefinitionType.COIN,
                                      }),
                                  )
                        }
                        intent="neutral"
                        priority="secondary"
                    >
                        <Translation id="TR_UNHIDE" />
                    </Button>
                ) : (
                    <>
                        {type === 'defi' ? (
                            <ButtonGroup intent="neutral" priority="secondary">
                                <Tooltip
                                    content={<Translation id="TR_DEFI_NO_VAULT_TOOLTIP" />}
                                    isActive={isSupplyButtonDisabled}
                                >
                                    <IconButton
                                        icon="plus"
                                        isDisabled={isSupplyButtonDisabled}
                                        onClick={navigateToYieldSupply}
                                    />
                                </Tooltip>

                                <Tooltip
                                    content={<Translation id="TR_DEFI_NO_VAULT_TOOLTIP" />}
                                    isActive={isWithdrawButtonDisabled}
                                >
                                    <IconButton
                                        icon="minus"
                                        isDisabled={isWithdrawButtonDisabled}
                                        onClick={navigateToYieldWithdraw}
                                    />
                                </Tooltip>
                            </ButtonGroup>
                        ) : (
                            <ButtonGroup intent="neutral" priority="secondary">
                                <Tooltip
                                    content={
                                        <Translation
                                            id={
                                                isDeviceCompromised
                                                    ? 'TR_RECEIVE_ADDRESS_SECURITY_CHECK_FAILED'
                                                    : 'TR_NAV_RECEIVE'
                                            }
                                        />
                                    }
                                >
                                    <IconButton
                                        key="token-receive"
                                        icon="arrowDown"
                                        isDisabled={!canReceiveToken}
                                        onClick={onReceiveButtonClick}
                                    />
                                </Tooltip>

                                <Tooltip content={<Translation id="TR_NAV_SEND" />}>
                                    <IconButton
                                        isDisabled={token.balance === '0'}
                                        key="token-send"
                                        icon="arrowUp"
                                        onClick={onSendButtonClick}
                                    />
                                </Tooltip>
                            </ButtonGroup>
                        )}
                    </>
                ))}
        </Row>
    );
};

interface TokenRowActionsProps {
    type?: TokensTableType;
    token: EnhancedTokenInfo;
    tokenStatusType: TokenManagementAction;
    account: Account;
    network: Network;
    yieldOpportunities?: YieldDto[];
    isUnverifiedTable?: boolean;
    setShowDeactivateModal: (value: boolean) => void;
}

export const TokenRowActions = ({
    type = 'default',
    token,
    tokenStatusType,
    account,
    network,
    yieldOpportunities,
    isUnverifiedTable,
    setShowDeactivateModal,
}: TokenRowActionsProps) => (
    <TokenRowBasicActions
        type={type}
        token={token}
        tokenStatusType={tokenStatusType}
        account={account}
        network={network}
        isUnverifiedTable={isUnverifiedTable}
        yieldOpportunities={yieldOpportunities}
        setShowDeactivateModal={setShowDeactivateModal}
    />
);
