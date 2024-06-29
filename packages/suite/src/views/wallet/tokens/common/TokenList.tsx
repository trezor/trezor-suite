import styled, { css } from 'styled-components';
import { Card, Dropdown, IconButton, ButtonGroup, Button, Icon } from '@trezor/components';
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
import { spacingsPx, typography } from '@trezor/theme';
import { Account, TokenAddress } from '@suite-common/wallet-types';
import { EventType, analytics } from '@trezor/suite-analytics';
import { goto } from 'src/actions/suite/routerActions';
import { Network } from '@suite-common/wallet-config';
import {
    DefinitionType,
    EnhancedTokenInfo,
    TokenManagementAction,
    tokenDefinitionsActions,
} from '@suite-common/token-definitions';
import { BlurUrls } from './BlurUrls';
import { showAddress } from 'src/actions/wallet/receiveActions';
import { getUnusedAddressFromAccount } from 'src/utils/wallet/coinmarket/coinmarketUtils';
import { openModal } from 'src/actions/suite/modalActions';
import { selectDevice } from '@suite-common/wallet-core';
import { GroupedMenuItems } from '@trezor/components/src/components/Dropdown/Menu';

const Table = styled(Card)`
    word-break: break-all;
`;

const Columns = styled.div`
    display: flex;
    padding: 0 ${spacingsPx.lg};
    border-bottom: 1px solid ${({ theme }) => theme.borderElevation2};
`;

const ColName = styled.div`
    ${typography.hint}
    margin: ${spacingsPx.md} 0;
    color: ${({ theme }) => theme.textSubdued};
    width: 20%;
`;

const Cell = styled.div<{ $isActions?: boolean; $isBigger?: boolean }>`
    ${typography.hint}
    align-items: center;
    padding: 10px ${spacingsPx.sm} 10px 0;
    width: ${({ $isBigger }) => ($isBigger ? `60%` : '20%')};
    gap: ${spacingsPx.xxs};

    ${({ $isActions }) =>
        $isActions &&
        css`
            display: flex;
            justify-content: flex-end;
            text-align: right;
            width: 20%;
        `}
`;

const Token = styled.div`
    display: flex;
    align-items: center;
    padding: ${spacingsPx.xs} 0;
    border-bottom: 1px solid ${({ theme }) => theme.borderElevation2};
    margin: 0 ${spacingsPx.lg};
    min-height: 81px;

    &:last-child {
        border-bottom: none;
    }
`;

const TokenName = styled.span`
    ${typography.body}
`;

const Amount = styled.div`
    display: flex;
    flex-direction: column;
`;

const StyledFiatValue = styled(FiatValue)`
    ${typography.body}
`;

const PriceTickerWrapper = styled.div`
    display: flex;
    justify-content: flex-start;
    width: 100%;
`;

const StyledFormattedCryptoAmount = styled(FormattedCryptoAmount)`
    ${typography.hint}
    color: ${({ theme }) => theme.textSubdued};
`;

const ContractAddress = styled.div`
    ${typography.hint};
    color: ${({ theme }) => theme.textDefault};
    display: inline-block;
    max-width: 200px;
    word-break: break-all;
    white-space: wrap;
`;

const StyledIcon = styled(Icon)`
    display: inline-block;
    margin-left: ${spacingsPx.xxs};
`;

const NoResults = styled.div`
    ${typography.body};
    padding: ${spacingsPx.lg};
    text-align: center;
`;

const getTokenExplorerUrl = (network: Network, token: EnhancedTokenInfo) => {
    const explorerUrl =
        network.networkType === 'cardano' ? network.explorer.token : network.explorer.account;

    const contractAddress = network.networkType === 'cardano' ? token.fingerprint : token.contract;

    return `${explorerUrl}${contractAddress}${network.explorer.queryString}`;
};

interface TokenListProps {
    account: Account;
    tokens: EnhancedTokenInfo[];
    network: Network;
    tokenStatusType: TokenManagementAction;
    hideRates?: boolean;
    searchQuery?: string;
}

export const TokenList = ({
    account,
    tokens,
    network,
    tokenStatusType,
    hideRates,
    searchQuery,
}: TokenListProps) => {
    const dispatch = useDispatch();
    const { isMobileLayout } = useLayoutSize();
    const { translationString } = useTranslation();
    const { address: unusedAddress, path } = getUnusedAddressFromAccount(account);
    const device = useSelector(selectDevice);
    const { isLocked } = useDevice();

    const isDeviceLocked = isLocked(true);

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

    return (
        <Table paddingType="none">
            <Columns>
                <ColName>
                    <Translation id="TR_TOKEN" />
                </ColName>
                <ColName>
                    <Translation id="TR_VALUES" />
                </ColName>
                {!hideRates && (
                    <>
                        <ColName>
                            <Translation id="TR_EXCHANGE_RATE" />
                        </ColName>
                        <ColName>
                            <Translation id="TR_7D_CHANGE" />
                        </ColName>
                    </>
                )}
            </Columns>
            {tokens.length === 0 && searchQuery ? (
                <NoResults>
                    <Translation id="TR_NO_SEARCH_RESULTS" />
                </NoResults>
            ) : (
                tokens.map(token => (
                    <Token key={token.contract}>
                        <Cell>
                            <TokenName>
                                <BlurUrls text={token.name} />
                            </TokenName>
                        </Cell>
                        <Cell $isBigger={hideRates}>
                            <Amount>
                                {!hideRates && (
                                    <StyledFiatValue
                                        amount={token.balance || '1'}
                                        symbol={network.symbol}
                                        tokenAddress={token.contract as TokenAddress}
                                        showLoadingSkeleton
                                    />
                                )}
                                <StyledFormattedCryptoAmount
                                    value={token.balance}
                                    symbol={token.symbol}
                                />
                            </Amount>
                        </Cell>
                        {!hideRates && (
                            <>
                                <Cell>
                                    <PriceTickerWrapper>
                                        <PriceTicker
                                            symbol={network.symbol}
                                            contractAddress={token.contract as TokenAddress}
                                            noEmptyStateTooltip
                                        />
                                    </PriceTickerWrapper>
                                </Cell>
                                <Cell>
                                    <TrendTicker
                                        symbol={network.symbol}
                                        contractAddress={token.contract as TokenAddress}
                                        noEmptyStateTooltip
                                    />
                                </Cell>
                            </>
                        )}
                        <Cell $isActions>
                            <Dropdown
                                alignMenu="bottom-right"
                                items={
                                    [
                                        {
                                            key: 'export',
                                            options: [
                                                {
                                                    label: <Translation id="TR_NAV_SEND" />,
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
                                                        tokenStatusType ===
                                                        TokenManagementAction.HIDE
                                                            ? !isMobileLayout
                                                            : true,
                                                },
                                                {
                                                    label: <Translation id="TR_NAV_RECEIVE" />,
                                                    onClick: onReceive,
                                                    isDisabled: isReceiveButtonDisabled,
                                                    isHidden:
                                                        tokenStatusType ===
                                                        TokenManagementAction.HIDE
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
                                                        tokenStatusType ===
                                                            TokenManagementAction.SHOW &&
                                                        !isMobileLayout,
                                                },
                                                {
                                                    label: <Translation id="TR_VIEW_IN_EXPLORER" />,
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
                                            label: translationString(
                                                network.networkType === 'cardano'
                                                    ? 'TR_POLICY_ID_ADDRESS'
                                                    : 'TR_CONTRACT_ADDRESS',
                                            ),
                                            options: [
                                                {
                                                    label: (
                                                        <ContractAddress>
                                                            {token.contract}
                                                            <StyledIcon icon="COPY" size={14} />
                                                        </ContractAddress>
                                                    ),
                                                    onClick: () =>
                                                        dispatch(
                                                            openModal({
                                                                type: 'copy-address',
                                                                addressType:
                                                                    network.networkType ===
                                                                    'cardano'
                                                                        ? 'policyId'
                                                                        : 'contract',
                                                                address: token.contract,
                                                            }),
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
                                                            <StyledIcon icon="COPY" size={14} />
                                                        </ContractAddress>
                                                    ),
                                                    onClick: () =>
                                                        dispatch(
                                                            openModal({
                                                                type: 'copy-address',
                                                                addressType: 'fingerprint',
                                                                address:
                                                                    token.fingerprint as string,
                                                            }),
                                                        ),
                                                },
                                            ],
                                        },
                                    ].filter(category => category) as GroupedMenuItems[]
                                }
                            />
                            {!isMobileLayout &&
                                (tokenStatusType === TokenManagementAction.SHOW ? (
                                    <Button
                                        icon="EYE_SLASH"
                                        onClick={() =>
                                            dispatch(
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
                                            icon="SEND"
                                            onClick={() => {
                                                goToWithAnalytics('wallet-send', {
                                                    params: {
                                                        symbol: account.symbol,
                                                        accountIndex: account.index,
                                                        accountType: account.accountType,
                                                        contractAddress: token.contract,
                                                    },
                                                });
                                            }}
                                        />
                                        <IconButton
                                            label={<Translation id="TR_NAV_RECEIVE" />}
                                            key="token-receive"
                                            variant="tertiary"
                                            icon="RECEIVE"
                                            isDisabled={isReceiveButtonDisabled}
                                            onClick={onReceive}
                                        />
                                    </ButtonGroup>
                                ))}
                        </Cell>
                    </Token>
                ))
            )}
        </Table>
    );
};
