import styled, { css } from 'styled-components';
import { Card, Dropdown, IconButton, ButtonGroup } from '@trezor/components';
import {
    FiatValue,
    FormattedCryptoAmount,
    PriceTicker,
    Translation,
    TrendTicker,
    TrezorLink,
} from 'src/components/suite';
import { Account } from 'src/types/wallet';
import { useDispatch, useLayoutSize, useSelector } from 'src/hooks/suite';
import { selectCurrentFiatRates } from '@suite-common/wallet-core';
import { TokenInfo } from '@trezor/blockchain-link-types';
import { spacingsPx, typography } from '@trezor/theme';
import { NetworkSymbol, getNetworkFeatures } from '@suite-common/wallet-config';
import { blurUrls, enhanceTokensWithRates, sortTokensWithRates } from 'src/utils/wallet/tokenUtils';
import { Rate, TokenAddress } from '@suite-common/wallet-types';
import { selectLocalCurrency } from 'src/reducers/wallet/settingsReducer';
import { isTokenDefinitionKnown, selectCoinDefinitions } from '@suite-common/token-definitions';
import { EventType, analytics } from '@trezor/suite-analytics';
import { goto } from 'src/actions/suite/routerActions';

const Table = styled(Card)`
    padding-bottom: ${spacingsPx.md};
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
            text-align: right;¨
            width: 10%;
        `}
`;

const Token = styled.div`
    display: flex;
    align-items: center;
    padding: ${spacingsPx.xs} 0;
    border-bottom: 1px solid ${({ theme }) => theme.borderElevation2};
    margin: 0 ${spacingsPx.lg};

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

const StyledPriceTicker = styled(PriceTicker)`
    width: 100%;
`;

const CryptoAmount = styled(FormattedCryptoAmount)`
    ${typography.hint}
    color: ${({ theme }) => theme.textSubdued};
`;

const StyledTrezorLink = styled(TrezorLink)`
    ${typography.hint}
`;

const DropdownFooter = styled.div`
    display: flex;
    flex-direction: column;
    border-top: 1px solid ${({ theme }) => theme.borderElevation2};
    padding: ${spacingsPx.sm};
    margin-top: ${spacingsPx.xxs};
`;

const FooterTitle = styled.div`
    ${typography.label}}
    color: black;
`;

interface TokenListProps {
    tokens: Account['tokens'];
    networkType: Account['networkType'];
    networkSymbol: NetworkSymbol;
    explorerUrl: string;
    explorerUrlQueryString: string;
    isTestnet?: boolean;
}

type EnhancedTokenInfo = TokenInfo & { fiatRate?: Rate };

export const TokenList = ({
    tokens,
    networkType,
    networkSymbol,
    explorerUrl,
    explorerUrlQueryString,
    isTestnet,
}: TokenListProps) => {
    const coinDefinitions = useSelector(state => selectCoinDefinitions(state, networkSymbol));
    const fiatRates = useSelector(selectCurrentFiatRates);
    const localCurrency = useSelector(selectLocalCurrency);
    const dispatch = useDispatch();
    const { isMobileLayout } = useLayoutSize();

    const tokensWithRates = enhanceTokensWithRates(tokens, localCurrency, networkSymbol, fiatRates);

    const sortedTokens = tokensWithRates.sort(sortTokensWithRates);

    if (!tokens || tokens.length === 0) return null;

    const goToWithAnalytics = (...[routeName, options]: Parameters<typeof goto>) => {
        if (networkSymbol) {
            analytics.report({
                type: EventType.AccountsActions,
                payload: { symbol: networkSymbol, action: routeName },
            });
        }
        dispatch(goto(routeName, options));
    };

    const hasCoinDefinitions = getNetworkFeatures(networkSymbol).includes('coin-definitions');
    const { knownTokens } = sortedTokens.reduce<{
        knownTokens: EnhancedTokenInfo[];
    }>(
        (acc, token) => {
            if (
                !hasCoinDefinitions ||
                isTokenDefinitionKnown(coinDefinitions?.data, networkSymbol, token.contract)
            ) {
                acc.knownTokens.push(token);
            }

            return acc;
        },
        { knownTokens: [] },
    );

    return (
        knownTokens.length > 0 && (
            <Table paddingType="none">
                <Columns>
                    <ColName>
                        <Translation id="TR_TOKEN" />
                    </ColName>
                    <ColName>
                        <Translation id="AMOUNT" />
                    </ColName>
                    {!isTestnet && (
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
                {knownTokens.map(t => (
                    <Token key={t.contract}>
                        <Cell>
                            <TokenName>{blurUrls(t.name)}</TokenName>
                        </Cell>
                        <Cell $isBigger={isTestnet}>
                            <Amount>
                                {!isTestnet && (
                                    <StyledFiatValue
                                        amount={t.balance || '1'}
                                        symbol={networkSymbol}
                                        tokenAddress={t.contract as TokenAddress}
                                        showLoadingSkeleton
                                    />
                                )}
                                <CryptoAmount
                                    value={t.balance}
                                    customSymbol={
                                        networkType === 'cardano'
                                            ? undefined
                                            : blurUrls(t.symbol?.toUpperCase())
                                    }
                                />
                            </Amount>
                        </Cell>
                        {!isTestnet && (
                            <>
                                <Cell>
                                    <StyledPriceTicker
                                        symbol={networkSymbol}
                                        contractAddress={t.contract as TokenAddress}
                                    />
                                </Cell>
                                <Cell>
                                    <TrendTicker
                                        symbol={networkSymbol}
                                        contractAddress={t.contract as TokenAddress}
                                    />
                                </Cell>
                            </>
                        )}
                        <Cell $isActions>
                            <Dropdown
                                alignMenu="bottom-right"
                                items={[
                                    {
                                        key: 'export',
                                        options: [
                                            {
                                                label: <Translation id="TR_NAV_SEND" />,
                                                onClick: () => {
                                                    goToWithAnalytics('wallet-send', {
                                                        preserveParams: true,
                                                    });
                                                },
                                                isHidden: !isMobileLayout,
                                            },
                                            {
                                                label: <Translation id="TR_NAV_RECEIVE" />,
                                                onClick: () => {
                                                    goToWithAnalytics('wallet-receive', {
                                                        preserveParams: true,
                                                    });
                                                },
                                                isHidden: !isMobileLayout,
                                            },
                                            {
                                                label: <Translation id="TR_HIDE_TOKEN" />,
                                                onClick: () => console.log(''),
                                            },
                                            {
                                                label: (
                                                    <StyledTrezorLink
                                                        variant="nostyle"
                                                        href={`${explorerUrl}${t.contract}${explorerUrlQueryString}`}
                                                    >
                                                        <Translation id="TR_VIEW_IN_EXPLORER" />
                                                    </StyledTrezorLink>
                                                ),
                                            },
                                        ],
                                    },
                                ]}
                                footer={
                                    <DropdownFooter>
                                        <FooterTitle>
                                            <Translation id="TR_CONTRACT_ADDRESS" />
                                        </FooterTitle>
                                    </DropdownFooter>
                                }
                            />
                            {!isMobileLayout && (
                                <ButtonGroup size="small" withTooltips variant="tertiary">
                                    <IconButton
                                        label={<Translation id="TR_NAV_SEND" />}
                                        key="token-send"
                                        variant="tertiary"
                                        icon="SEND"
                                        onClick={() => {
                                            goToWithAnalytics('wallet-send', {
                                                preserveParams: true,
                                            });
                                        }}
                                    />
                                    <IconButton
                                        label={<Translation id="TR_NAV_RECEIVE" />}
                                        key="token-receive"
                                        variant="tertiary"
                                        icon="RECEIVE"
                                        onClick={() => {
                                            goToWithAnalytics('wallet-receive', {
                                                preserveParams: true,
                                            });
                                        }}
                                    />
                                </ButtonGroup>
                            )}
                        </Cell>
                    </Token>
                ))}
            </Table>
        )
    );
};
