import styled from 'styled-components';

import { selectDevice } from '@suite-common/wallet-core';
import { Account, AddressType, TokenAddress } from '@suite-common/wallet-types';
import { Network, getCoingeckoId } from '@suite-common/wallet-config';
import {
    DefinitionType,
    EnhancedTokenInfo,
    TokenManagementAction,
    getContractAddressForNetwork,
    selectIsSpecificCoinDefinitionKnown,
    tokenDefinitionsActions,
} from '@suite-common/token-definitions';
import { notificationsActions } from '@suite-common/toast-notifications';
import { copyToClipboard } from '@trezor/dom-utils';
import {
    Dropdown,
    IconButton,
    ButtonGroup,
    Button,
    Icon,
    Table,
    GroupedMenuItems,
    AssetLogo,
    Row,
    Column,
    Text,
} from '@trezor/components';
import { spacings, spacingsPx } from '@trezor/theme';
import { EventType, analytics } from '@trezor/suite-analytics';

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
    useLayoutSize,
    useSelector,
    useTranslation,
} from 'src/hooks/suite';
import { goto } from 'src/actions/suite/routerActions';
import { BlurUrls } from '../BlurUrls';
import { showAddress } from 'src/actions/wallet/receiveActions';
import { getUnusedAddressFromAccount } from 'src/utils/wallet/coinmarket/coinmarketUtils';
import { openModal } from 'src/actions/suite/modalActions';
import { formatTokenSymbol } from 'src/utils/wallet/tokenUtils';
import {
    selectIsCopyAddressModalShown,
    selectIsUnhideTokenModalShown,
} from 'src/reducers/suite/suiteReducer';
import { SUITE } from 'src/actions/suite/constants';

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

const getTokenExplorerUrl = (network: Network, token: EnhancedTokenInfo) => {
    const explorerUrl =
        network.networkType === 'cardano' ? network.explorer.token : network.explorer.account;
    const contractAddress = network.networkType === 'cardano' ? token.fingerprint : token.contract;
    const queryString = network.explorer.queryString ?? '';

    return `${explorerUrl}${contractAddress}${queryString}`;
};

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
    const device = useSelector(selectDevice);
    const { isLocked } = useDevice();
    const shouldShowCopyAddressModal = useSelector(selectIsCopyAddressModalShown);
    const shouldShowUnhideTokenModal = useSelector(selectIsUnhideTokenModalShown);
    const isTokenKnown = useSelector(state =>
        selectIsSpecificCoinDefinitionKnown(state, account.symbol, token.contract as TokenAddress),
    );
    const isDeviceLocked = isLocked(true);
    const networkContractAddress = getContractAddressForNetwork(account.symbol, token.contract);
    const coingeckoId = getCoingeckoId(account.symbol);

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

    const onCopyAddress = (address: string, addressType: AddressType) => {
        if (shouldShowCopyAddressModal) {
            dispatch(
                openModal({
                    type: 'copy-address',
                    addressType,
                    address,
                }),
            );
        } else {
            const result = copyToClipboard(address);
            if (typeof result !== 'string') {
                dispatch(notificationsActions.addToast({ type: 'copy-to-clipboard' }));
            }
        }
    };

    const isReceiveButtonDisabled = isDeviceLocked || !!device.authConfirm;

    return (
        <Table.Row isCollapsed={isCollapsed}>
            <Table.Cell>
                <Row gap={spacings.xs}>
                    <AssetLogo
                        coingeckoId={coingeckoId || ''}
                        placeholder={token.name || token.symbol || 'token'}
                        contractAddress={networkContractAddress as TokenAddress}
                        size={24}
                        shouldTryToFetch={isTokenKnown}
                    />
                    <BlurUrls text={token.name} />
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
                            symbol={formatTokenSymbol(token.symbol || '')}
                            isBalance
                        />
                    </Text>
                </Column>
            </Table.Cell>
            {!hideRates && (
                <>
                    <Table.Cell align="right">
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
            <Table.Cell align="right">
                <Row gap={spacings.xs}>
                    <Dropdown
                        alignMenu="bottom-right"
                        items={
                            [
                                {
                                    key: 'export',
                                    options: [
                                        {
                                            label: <Translation id="TR_NAV_SEND" />,
                                            icon: 'SEND',
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
                                            icon: 'RECEIVE',
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
                                                        networkSymbol: network.symbol,
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
                                                window.open(
                                                    getTokenExplorerUrl(network, token),
                                                    '_blank',
                                                );
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
                                                onCopyAddress(token.contract, 'contract'),
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
                                                onCopyAddress(
                                                    token.fingerprint as string,
                                                    'fingerprint',
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
                                                onCopyAddress(token.policyId as string, 'policyId'),
                                        },
                                    ],
                                },
                            ].filter(category => category) as GroupedMenuItems[]
                        }
                    />
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
                                                  networkSymbol: network.symbol,
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
