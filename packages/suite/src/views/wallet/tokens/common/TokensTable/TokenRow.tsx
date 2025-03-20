import styled from 'styled-components';

import {
    DefinitionType,
    EnhancedTokenInfo,
    TokenManagementAction,
    selectIsSpecificCoinDefinitionKnown,
    tokenDefinitionsActions,
} from '@suite-common/token-definitions';
import { getUnusedAddressFromAccount, toTokenCryptoId } from '@suite-common/trading';
import { Network, getCoingeckoId } from '@suite-common/wallet-config';
import { selectSelectedDevice, sendFormActions } from '@suite-common/wallet-core';
import { Account, TokenAddress } from '@suite-common/wallet-types';
import {
    getContractAddressForNetworkSymbol,
    getTokenExplorerUrl,
} from '@suite-common/wallet-utils';
import {
    AssetLogo,
    Button,
    ButtonGroup,
    Column,
    Dropdown,
    GroupedMenuItems,
    Icon,
    IconButton,
    Row,
    Table,
    Text,
} from '@trezor/components';
import { EventType, analytics } from '@trezor/suite-analytics';
import { spacings, spacingsPx } from '@trezor/theme';

import { SUITE } from 'src/actions/suite/constants';
import { copyAddressToClipboard, showCopyAddressModal } from 'src/actions/suite/copyAddressActions';
import { openModal } from 'src/actions/suite/modalActions';
import { goto } from 'src/actions/suite/routerActions';
import { showAddress } from 'src/actions/wallet/receiveActions';
import { setTradingPrefilledFromCryptoId } from 'src/actions/wallet/trading/tradingCommonActions';
import {
    FiatValue,
    FormattedCryptoAmount,
    PriceTicker,
    Translation,
    TrendTicker,
} from 'src/components/suite';
import {
    useDevice,
    useDispatch,
    useExternalLink,
    useLayoutSize,
    useSelector,
    useTranslation,
} from 'src/hooks/suite';
import {
    selectIsCopyAddressModalShown,
    selectIsUnhideTokenModalShown,
} from 'src/reducers/suite/suiteReducer';
import { formatTokenSymbol } from 'src/utils/wallet/tokenUtils';

import { BlurUrls } from '../BlurUrls';

const ContractAddress = styled.div`
    display: inline-block;
    max-width: 200px;
    word-break: break-all;
    white-space: wrap;
`;

const IconWrapper = styled.div`
    display: inline-block;
    margin-left: ${spacingsPx.xxs};
`;

interface TokenRowProps {
    account: Account;
    token: EnhancedTokenInfo;
    network: Network;
    tokenStatusType: TokenManagementAction;
    hideRates?: boolean;
    isUnverifiedTable?: boolean;
    isCollapsed?: boolean;
}

export const TokenRow = ({
    account,
    token,
    network,
    tokenStatusType,
    hideRates,
    isUnverifiedTable,
    isCollapsed,
}: TokenRowProps) => {
    const dispatch = useDispatch();
    const { isMobileLayout } = useLayoutSize();
    const { translationString } = useTranslation();
    const { address: unusedAddress, path } = getUnusedAddressFromAccount(account);
    const device = useSelector(selectSelectedDevice);
    const { isLocked } = useDevice();
    const shouldShowCopyAddressModal = useSelector(selectIsCopyAddressModalShown);
    const shouldShowUnhideTokenModal = useSelector(selectIsUnhideTokenModalShown);
    const isTokenKnown = useSelector(state =>
        selectIsSpecificCoinDefinitionKnown(state, account.symbol, token.contract as TokenAddress),
    );
    const { coins } = useSelector(state => state.wallet.trading.info);
    const isDeviceLocked = isLocked(true);
    const networkContractAddress = getContractAddressForNetworkSymbol(
        account.symbol,
        token.contract,
    );
    const coingeckoId = getCoingeckoId(account.symbol);
    const explorerUrl = useExternalLink(getTokenExplorerUrl(network, token));

    if (!unusedAddress || !device) return null;

    const goToWithAnalytics = (...[routeName, options]: Parameters<typeof goto>) => {
        if (network.networkType) {
            analytics.report({
                type: EventType.AccountsActions,
                payload: { symbol: network.symbol, action: routeName },
            });
        }
        dispatch(goto(routeName, options));
    };

    const onReceive = () => {
        if (network.networkType === 'cardano') {
            goToWithAnalytics('wallet-receive', {
                preserveParams: true,
            });
        } else {
            dispatch(showAddress(path, unusedAddress));
        }
    };

    const isReceiveButtonDisabled = isDeviceLocked || !!device.authConfirm;

    const contractAddress = getContractAddressForNetworkSymbol(account.symbol, token.contract);
    const tokenCryptoId = toTokenCryptoId(account.symbol, contractAddress);
    const tokenTradingOptions = coins?.[tokenCryptoId]?.services;

    const canBuyToken = !!tokenTradingOptions && tokenTradingOptions.buy;
    const canSwapToken =
        (!!tokenTradingOptions && tokenTradingOptions.exchange) || token.balance === '0';
    const canSellToken = !!tokenTradingOptions && tokenTradingOptions.sell;

    return (
        <Table.Row isCollapsed={isCollapsed}>
            <Table.Cell>
                <Row gap={spacings.xs}>
                    <AssetLogo
                        coingeckoId={coingeckoId || ''}
                        placeholder={token.name || token.symbol || 'token'}
                        contractAddress={networkContractAddress}
                        size={24}
                        shouldTryToFetch={isTokenKnown}
                    />
                    {isTokenKnown ? token.name : <BlurUrls text={token.name} />}
                </Row>
            </Table.Cell>
            <Table.Cell>
                <Column alignItems="flex-start">
                    {!hideRates && (
                        <FiatValue
                            amount={token.balance || ''}
                            symbol={network.symbol}
                            tokenAddress={token.contract as TokenAddress}
                            showLoadingSkeleton
                        />
                    )}
                    <Text variant="tertiary" typographyStyle="hint">
                        <FormattedCryptoAmount
                            value={token.balance}
                            symbol={formatTokenSymbol(token.symbol ?? '')}
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
                <Row gap={spacings.xs}>
                    <Dropdown
                        placement={{ position: 'bottom', alignment: 'start' }}
                        items={
                            [
                                {
                                    key: 'options',
                                    options: [
                                        {
                                            label: <Translation id="TR_BUY" />,
                                            'data-testid': '@trading/tokens/buy-button',
                                            icon: 'currencyCircleDollar',
                                            onClick: () => {
                                                dispatch(
                                                    setTradingPrefilledFromCryptoId(tokenCryptoId),
                                                );
                                                goToWithAnalytics('wallet-trading-buy', {
                                                    params: {
                                                        symbol: account.symbol,
                                                        accountIndex: account.index,
                                                        accountType: account.accountType,
                                                    },
                                                });
                                            },
                                            isDisabled: !canBuyToken,
                                        },
                                        {
                                            label: <Translation id="TR_TRADING_SELL" />,
                                            'data-testid': '@trading/tokens/sell-button',
                                            icon: 'currencyCircleDollar',
                                            onClick: () => {
                                                dispatch(
                                                    setTradingPrefilledFromCryptoId(tokenCryptoId),
                                                );
                                                goToWithAnalytics('wallet-trading-sell', {
                                                    params: {
                                                        symbol: account.symbol,
                                                        accountIndex: account.index,
                                                        accountType: account.accountType,
                                                    },
                                                });
                                            },
                                            isDisabled: token.balance === '0' || !canSellToken,
                                        },
                                        {
                                            label: <Translation id="TR_TRADING_SWAP" />,
                                            'data-testid': '@trading/tokens/swap-button',
                                            icon: 'arrowsLeftRight',
                                            onClick: () => {
                                                dispatch(
                                                    setTradingPrefilledFromCryptoId(tokenCryptoId),
                                                );
                                                goToWithAnalytics('wallet-trading-exchange', {
                                                    params: {
                                                        symbol: account.symbol,
                                                        accountIndex: account.index,
                                                        accountType: account.accountType,
                                                    },
                                                });
                                            },
                                            isHidden: !isMobileLayout,
                                            isDisabled: !canSwapToken,
                                        },
                                        {
                                            label: <Translation id="TR_NAV_SEND" />,
                                            'data-testid': '@trading/tokens/send-button',
                                            icon: 'send',
                                            onClick: () => {
                                                goToWithAnalytics('wallet-send', {
                                                    params: {
                                                        symbol: account.symbol,
                                                        accountIndex: account.index,
                                                        accountType: account.accountType,
                                                    },
                                                });
                                            },
                                            isDisabled: token.balance === '0',
                                            isHidden:
                                                tokenStatusType === TokenManagementAction.HIDE
                                                    ? !isMobileLayout
                                                    : true,
                                        },
                                        {
                                            label: <Translation id="TR_NAV_RECEIVE" />,
                                            'data-testid': '@trading/tokens/receive-button',
                                            icon: 'receive',
                                            onClick: onReceive,
                                            isDisabled: isReceiveButtonDisabled,
                                            isHidden:
                                                tokenStatusType === TokenManagementAction.HIDE
                                                    ? !isMobileLayout
                                                    : true,
                                        },
                                        {
                                            label: (
                                                <Translation
                                                    id={
                                                        tokenStatusType ===
                                                        TokenManagementAction.SHOW
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
                                                !isMobileLayout,
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
                                                goToWithAnalytics('wallet-index', {
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
                                    ],
                                },
                                {
                                    key: 'contract-address',
                                    label: translationString('TR_CONTRACT_ADDRESS'),
                                    options: [
                                        {
                                            label: (
                                                <ContractAddress>
                                                    {token.contract}
                                                    <IconWrapper>
                                                        <Icon name="copy" size={14} />
                                                    </IconWrapper>
                                                </ContractAddress>
                                            ),
                                            onClick: () =>
                                                dispatch(
                                                    shouldShowCopyAddressModal
                                                        ? showCopyAddressModal(
                                                              token.contract,
                                                              'contract',
                                                          )
                                                        : copyAddressToClipboard(token.contract),
                                                ),
                                        },
                                    ],
                                },
                                token.fingerprint && {
                                    key: 'fingerprint',
                                    label: translationString('TR_FINGERPRINT_ADDRESS'),
                                    options: [
                                        {
                                            label: (
                                                <ContractAddress>
                                                    {token.fingerprint}
                                                    <IconWrapper>
                                                        <Icon name="copy" size={14} />
                                                    </IconWrapper>
                                                </ContractAddress>
                                            ),
                                            onClick: () =>
                                                token.fingerprint &&
                                                dispatch(
                                                    shouldShowCopyAddressModal
                                                        ? showCopyAddressModal(
                                                              token.fingerprint,
                                                              'fingerprint',
                                                          )
                                                        : copyAddressToClipboard(token.contract),
                                                ),
                                        },
                                    ],
                                },
                                token.policyId && {
                                    key: 'policyId',
                                    label: translationString('TR_POLICY_ID_ADDRESS'),
                                    options: [
                                        {
                                            label: (
                                                <ContractAddress>
                                                    {token.policyId}
                                                    <IconWrapper>
                                                        <Icon name="copy" size={14} />
                                                    </IconWrapper>
                                                </ContractAddress>
                                            ),
                                            onClick: () =>
                                                token.policyId &&
                                                dispatch(
                                                    shouldShowCopyAddressModal
                                                        ? showCopyAddressModal(
                                                              token.policyId,
                                                              'policyId',
                                                          )
                                                        : copyAddressToClipboard(token.contract),
                                                ),
                                        },
                                    ],
                                },
                            ].filter(category => category) as GroupedMenuItems[]
                        }
                    />
                    {!isMobileLayout && (
                        <IconButton
                            label={
                                canSwapToken ? (
                                    <Translation id="TR_TRADING_SWAP" />
                                ) : (
                                    <Translation id="TR_TRADING_SWAP_UNAVAILABLE" />
                                )
                            }
                            isDisabled={!canSwapToken}
                            key="swap"
                            variant="tertiary"
                            icon="arrowsLeftRight"
                            size="small"
                            onClick={() => {
                                dispatch(setTradingPrefilledFromCryptoId(tokenCryptoId));
                                goToWithAnalytics('wallet-trading-exchange', {
                                    params: {
                                        symbol: account.symbol,
                                        accountIndex: account.index,
                                        accountType: account.accountType,
                                    },
                                });
                            }}
                        />
                    )}
                    {!isMobileLayout &&
                        (tokenStatusType === TokenManagementAction.SHOW ? (
                            <Button
                                icon="show"
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
                                variant="tertiary"
                                size="small"
                            >
                                <Translation id="TR_UNHIDE" />
                            </Button>
                        ) : (
                            <ButtonGroup size="small" variant="tertiary">
                                <IconButton
                                    label={<Translation id="TR_NAV_SEND" />}
                                    isDisabled={token.balance === '0'}
                                    key="token-send"
                                    variant="tertiary"
                                    icon="send"
                                    onClick={() => {
                                        dispatch({
                                            type: SUITE.SET_SEND_FORM_PREFILL,
                                            payload: token.contract,
                                        });
                                        dispatch(
                                            sendFormActions.removeDraft({
                                                accountKey: account.key,
                                            }),
                                        );
                                        goToWithAnalytics('wallet-send', {
                                            params: {
                                                symbol: account.symbol,
                                                accountIndex: account.index,
                                                accountType: account.accountType,
                                            },
                                        });
                                    }}
                                />
                                <IconButton
                                    label={<Translation id="TR_NAV_RECEIVE" />}
                                    key="token-receive"
                                    variant="tertiary"
                                    icon="receive"
                                    isDisabled={isReceiveButtonDisabled}
                                    onClick={onReceive}
                                />
                            </ButtonGroup>
                        ))}
                </Row>
            </Table.Cell>
        </Table.Row>
    );
};
