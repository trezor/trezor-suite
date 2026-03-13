import { ReactNode, useState } from 'react';

import { events } from '@suite/analytics';
import { selectIsCopyAddressModalShown, selectIsUnhideTokenModalShown } from '@suite/flags';
import { Translation } from '@suite/intl';
import { openModal } from '@suite/modal';
import { goto } from '@suite/router';
import { selectSelectedDevice } from '@suite-common/device';
import {
    DefinitionType,
    EnhancedTokenInfo,
    TokenManagementAction,
    selectIsSpecificCoinDefinitionKnown,
    tokenDefinitionsActions,
} from '@suite-common/token-definitions';
import {
    TradingType,
    getTradingPrefilledFromAccountData,
    getUnusedAddressFromAccount,
    selectTradingInfo,
    toTokenCryptoId,
    tradingActions,
} from '@suite-common/trading';
import { Explorer, Network, getCoingeckoId } from '@suite-common/wallet-config';
import { selectExplorer, sendFormActions } from '@suite-common/wallet-core';
import { Account, TokenAddress } from '@suite-common/wallet-types';
import {
    getContractAddressForNetworkSymbol,
    getTokenExplorerUrl,
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
    Table,
    Text,
    Tooltip,
} from '@trezor/components';
import { AssetLogo } from '@trezor/product-components';
import { spacings } from '@trezor/theme';

import { SUITE } from 'src/actions/suite/constants';
import { copyAddressToClipboard, showCopyAddressModal } from 'src/actions/suite/copyAddressActions';
import { setSendFormPrefill } from 'src/actions/suite/suiteActions';
import { showAddress } from 'src/actions/wallet/receiveActions';
import {
    Address,
    BaseCurrencyValue,
    FormattedCryptoAmount,
    PriceTicker,
    TrendTicker,
} from 'src/components/suite';
import { StellarManageTokenModal } from 'src/components/suite/modals/ReduxModal/UserContextModal/StellarManageTokenModal';
import {
    useDevice,
    useDispatch,
    useExternalLink,
    useLayoutSize,
    useSelector,
} from 'src/hooks/suite';
import { selectIsDeviceCompromised } from 'src/selectors/suite/suiteAuthenticityChecksSelectors';
import { useAnalytics } from 'src/support/useAnalytics';
import { getTokenAddressTranslationId } from 'src/utils/wallet/tokenUtils';

import { BlurUrls } from '../BlurUrls';

type TokenRowProps = {
    account: Account;
    token: EnhancedTokenInfo;
    network: Network;
    tokenStatusType: TokenManagementAction;
    hideRates?: boolean;
    isUnverifiedTable?: boolean;
    isCollapsed?: boolean;
};

export const TokenRow = ({
    account,
    token,
    network,
    tokenStatusType,
    hideRates,
    isUnverifiedTable,
    isCollapsed,
}: TokenRowProps) => {
    const analytics = useAnalytics();
    const dispatch = useDispatch();
    const { isBelowTablet } = useLayoutSize();
    const { address: unusedAddress, path } = getUnusedAddressFromAccount(account);
    const device = useSelector(selectSelectedDevice);
    const { isLocked } = useDevice();
    const shouldShowCopyAddressModal = useSelector(selectIsCopyAddressModalShown);
    const shouldShowUnhideTokenModal = useSelector(selectIsUnhideTokenModalShown);
    const isTokenKnown = useSelector(state =>
        selectIsSpecificCoinDefinitionKnown(state, account.symbol, token.contract as TokenAddress),
    );
    const { coins } = useSelector(selectTradingInfo);
    const isDeviceLocked = isLocked(true);
    const isDeviceCompromised = useSelector(selectIsDeviceCompromised);
    const [showDeactivateModal, setShowDeactivateModal] = useState(false);

    const explorer = useSelector(state => selectExplorer(state, network.symbol)) as Explorer;

    const coingeckoId = getCoingeckoId(account.symbol);
    const explorerUrl = useExternalLink(getTokenExplorerUrl(explorer, network.networkType, token));

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

    const onReceive = () => {
        if (network.networkType === 'cardano') {
            goToWithAnalytics({ routeName: 'wallet-receive', preserveParams: true });
        } else {
            dispatch(showAddress(path, unusedAddress));
        }
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

    const contractAddress = getContractAddressForNetworkSymbol(account.symbol, token.contract);
    const tokenCryptoId = toTokenCryptoId(account.symbol, contractAddress);
    const tokenTradingOptions = coins?.[tokenCryptoId]?.services;

    const canBuyToken = !!tokenTradingOptions && tokenTradingOptions.buy;
    const canSwapToken =
        (!!tokenTradingOptions && tokenTradingOptions.exchange) || token.balance === '0';
    const canSellToken = !!tokenTradingOptions && tokenTradingOptions.sell;
    const canReceiveToken = !isDeviceLocked && !isDeviceCompromised;

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

    return (
        <>
            <Table.Row isCollapsed={isCollapsed}>
                <Table.Cell>
                    <Row gap={spacings.xs}>
                        <AssetLogo
                            coingeckoId={coingeckoId || ''}
                            placeholder={token.name || token.symbol || 'token'}
                            symbol={account.symbol}
                            contractAddress={token.contract}
                            size={24}
                            shouldTryToFetch={isTokenKnown}
                        />
                        {isTokenKnown ? token.name : <BlurUrls text={token.name} />}
                    </Row>
                </Table.Cell>
                <Table.Cell>
                    <Column alignItems="flex-start">
                        {!hideRates && (
                            <BaseCurrencyValue
                                amount={token.balance || ''}
                                symbol={network.symbol}
                                tokenAddress={token.contract as TokenAddress}
                                showLoadingSkeleton
                            />
                        )}
                        <Text intent="neutral" priority="secondary" typographyStyle="body-sm">
                            {/* TODO(stellar): I think it would be better to display the asset code as a symbol. */}
                            <FormattedCryptoAmount
                                data-testid={`@token-row/${token.name}/crypto-amount`}
                                value={token.balance}
                                symbol={token.symbol}
                                contractAddress={token.contract}
                            />
                        </Text>
                    </Column>
                </Table.Cell>
                {!hideRates && (
                    <>
                        <Table.Cell align="end">
                            <PriceTicker
                                symbol={network.symbol}
                                contractAddress={token.contract as TokenAddress}
                                noEmptyStateTooltip
                            />
                        </Table.Cell>
                        <Table.Cell>
                            <TrendTicker
                                symbol={network.symbol}
                                contractAddress={token.contract as TokenAddress}
                                noEmptyStateTooltip
                            />
                        </Table.Cell>
                    </>
                )}
                <Table.Cell align="end">
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
                                                        id={getTokenAddressTranslationId(
                                                            network.networkType,
                                                        )}
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
                                    onClick: () =>
                                        onTradeButtonClick('buy', {
                                            routeName: 'wallet-trading-buy',
                                        }),
                                    isDisabled: !canBuyToken,
                                },
                                {
                                    label: <Translation id="TR_TRADING_SELL" />,
                                    'data-testid': '@trading/tokens/sell-button',
                                    icon: 'currencyCircleDollar',
                                    onClick: () =>
                                        onTradeButtonClick('sell', {
                                            routeName: 'wallet-trading-sell',
                                        }),
                                    isDisabled: token.balance === '0' || !canSellToken,
                                },
                                {
                                    label: <Translation id="TR_TRADING_SWAP" />,
                                    'data-testid': '@trading/tokens/swap-button',
                                    icon: 'arrowsLeftRight',
                                    onClick: () =>
                                        onTradeButtonClick('exchange', {
                                            routeName: 'wallet-trading-exchange',
                                        }),
                                    isHidden: !isBelowTablet,
                                    isDisabled: !canSwapToken,
                                },
                                {
                                    label: <Translation id="TR_NAV_SEND" />,
                                    'data-testid': '@trading/tokens/send-button',
                                    icon: 'arrowUp',
                                    onClick: () => {
                                        goToWithAnalytics({
                                            routeName: 'wallet-send',
                                            params: {
                                                symbol: account.symbol,
                                                accountIndex: account.index,
                                                accountType: account.accountType,
                                            },
                                        });
                                    },
                                    isDisabled: token.balance === '0',
                                    isHidden:
                                        account.networkType === 'tron' ||
                                        (tokenStatusType === TokenManagementAction.HIDE
                                            ? !isBelowTablet
                                            : true),
                                },
                                {
                                    label: <Translation id="TR_NAV_RECEIVE" />,
                                    'data-testid': '@trading/tokens/receive-button',
                                    icon: 'arrowDown',
                                    onClick: onReceive,
                                    isDisabled: !canReceiveToken,
                                    isHidden:
                                        tokenStatusType === TokenManagementAction.HIDE
                                            ? !isBelowTablet
                                            : true,
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
                                    onClick: () =>
                                        dispatch(
                                            tokenDefinitionsActions.setTokenStatus({
                                                symbol: network.symbol,
                                                contractAddress: token.contract,
                                                status: tokenStatusType,
                                                type: DefinitionType.COIN,
                                            }),
                                        ),
                                    isHidden:
                                        tokenStatusType === TokenManagementAction.SHOW &&
                                        !isBelowTablet,
                                },
                                {
                                    label: <Translation id="TR_VIEW_ALL_TRANSACTION" />,
                                    'data-testid': '@trading/tokens/transactions-button',
                                    icon: 'newspaper',
                                    onClick: () => {
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
                                    },
                                },
                                {
                                    label: <Translation id="TR_VIEW_IN_EXPLORER" />,
                                    icon: 'arrowUpRight',
                                    onClick: () => {
                                        window.open(explorerUrl, '_blank');
                                    },
                                },
                                {
                                    label: <Translation id="TR_DEACTIVATE_TOKEN" />,
                                    icon: 'x',
                                    onClick: () => setShowDeactivateModal(true),
                                    // Only show for Stellar tokens
                                    isHidden: network.networkType !== 'stellar',
                                },
                            ]}
                        />
                        {!isBelowTablet && (
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
                                    onClick={() =>
                                        onTradeButtonClick('exchange', {
                                            routeName: 'wallet-trading-exchange',
                                        })
                                    }
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
                                <ButtonGroup intent="neutral" priority="secondary">
                                    {account.networkType !== 'tron' ? (
                                        <Tooltip content={<Translation id="TR_NAV_SEND" />}>
                                            <IconButton
                                                isDisabled={token.balance === '0'}
                                                key="token-send"
                                                icon="arrowUp"
                                                onClick={() => {
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
                                                }}
                                            />
                                        </Tooltip>
                                    ) : null}
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
                                            onClick={onReceive}
                                        />
                                    </Tooltip>
                                </ButtonGroup>
                            ))}
                    </Row>
                </Table.Cell>
            </Table.Row>
            {showDeactivateModal && (
                <StellarManageTokenModal
                    mode="deactivate"
                    symbol={network.symbol}
                    contractAddress={token.contract}
                    tokenBalance={token.balance || '0'}
                    onCancel={() => setShowDeactivateModal(false)}
                />
            )}
        </>
    );
};
