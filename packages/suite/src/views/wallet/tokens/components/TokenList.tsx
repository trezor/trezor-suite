import { useMemo, Fragment } from 'react';
import styled, { css, useTheme } from 'styled-components';
import { variables, Icon, Card } from '@trezor/components';
import {
    FiatValue,
    FormattedCryptoAmount,
    QuestionTooltip,
    TrezorLink,
} from 'src/components/suite';
import { Account } from 'src/types/wallet';
import { useSelector } from 'src/hooks/suite';
import { enhanceTokensWithRates, sortTokensWithRates } from '@suite-common/wallet-utils';
import { selectCoinsLegacy, selectTokenDefinitions } from '@suite-common/wallet-core';
import { NoRatesTooltip } from 'src/components/suite/Ticker/NoRatesTooltip';
import { FiatRates, TokenInfo } from '@trezor/blockchain-link-types';
import { spacingsPx } from '@trezor/theme';
import { NetworkSymbol, getNetworkFeatures } from '@suite-common/wallet-config';

const Wrapper = styled(Card)<{ isTestnet?: boolean }>`
    display: grid;
    padding: 12px 16px;
    grid-template-columns: ${props => (props.isTestnet ? 'auto auto 44px' : 'auto auto auto 44px')};
    word-break: break-all;
`;

const TokenSymbol = styled.span`
    font-weight: ${variables.FONT_WEIGHT.MEDIUM};
    font-size: ${variables.FONT_SIZE.NORMAL};
    text-transform: uppercase;
    padding-right: 2px;
`;

interface ColProps {
    justify?: 'left' | 'right';
    isTestnet?: boolean;
}

const Col = styled.div<ColProps>`
    padding: 10px 12px 10px 0;
    color: ${({ theme }) => theme.TYPE_DARK_GREY};
    font-size: ${variables.FONT_SIZE.SMALL};
    border-top: 1px solid ${({ theme }) => theme.STROKE_GREY};

    &:nth-child(${({ isTestnet }) => (isTestnet ? '-n + 3' : '-n + 4')}) {
        /* first row */
        border-top: none;
    }

    ${({ justify }) =>
        justify &&
        css`
            justify-content: ${justify === 'right' ? 'flex-end' : 'flex-start'};
            text-align: ${justify === 'right' ? 'right' : 'left'};
        `}
`;

const TokenName = styled.span`
    @media only screen and (max-width: ${variables.SCREEN_SIZE.SM}) {
        display: none;
    }
`;

const FiatWrapper = styled.div`
    font-size: ${variables.FONT_SIZE.SMALL};
    font-weight: ${variables.FONT_WEIGHT.MEDIUM};
    color: ${({ theme }) => theme.TYPE_LIGHT_GREY};
`;

const CryptoAmount = styled(FormattedCryptoAmount)`
    color: ${({ theme }) => theme.TYPE_DARK_GREY};
    font-size: ${variables.FONT_SIZE.NORMAL};
    font-weight: ${variables.FONT_WEIGHT.MEDIUM};
`;

const StyledNoRatesTooltip = styled(NoRatesTooltip)`
    justify-content: flex-end;
`;

const StyledQuestionTooltip = styled(QuestionTooltip)<{ addMarginTop: boolean }>`
    ${({ addMarginTop }) =>
        addMarginTop &&
        css`
            margin-top: ${spacingsPx.xxl};
        `}
    margin-bottom: ${spacingsPx.sm};
`;

interface TokenListProps {
    tokens: Account['tokens'];
    networkType: Account['networkType'];
    explorerUrl: string;
    explorerUrlQueryString: string;
    isTestnet?: boolean;
    networkSymbol: NetworkSymbol;
}

type EnhancedTokenInfo = TokenInfo & { rates?: FiatRates };

export const TokenList = ({
    tokens,
    explorerUrl,
    explorerUrlQueryString,
    isTestnet,
    networkType,
    networkSymbol,
}: TokenListProps) => {
    const theme = useTheme();
    const coins = useSelector(selectCoinsLegacy);
    const tokenDefinitions = useSelector(state => selectTokenDefinitions(state, networkSymbol));

    const sortedTokens: EnhancedTokenInfo[] = useMemo(() => {
        const tokensWithRates = enhanceTokensWithRates(tokens, coins);

        return tokensWithRates.sort(sortTokensWithRates);
    }, [tokens, coins]);

    if (!tokens || tokens.length === 0) return null;

    const hasNetworkFeatures = getNetworkFeatures(networkSymbol).includes('token-definitions');
    const { knownTokens, unknownTokens } = sortedTokens.reduce<{
        knownTokens: EnhancedTokenInfo[];
        unknownTokens: EnhancedTokenInfo[];
    }>(
        (acc, token) => {
            if (tokenDefinitions[token.contract]?.isTokenKnown || !hasNetworkFeatures) {
                acc.knownTokens.push(token);
            } else {
                acc.unknownTokens.push(token);
            }

            return acc;
        },
        { knownTokens: [], unknownTokens: [] },
    );

    return (
        <>
            {[knownTokens, unknownTokens].map((tokens, groupIndex) =>
                tokens.length ? (
                    <Fragment key={groupIndex === 0 ? 'knownTokens' : 'unknownTokens'}>
                        {groupIndex === 1 && (
                            <StyledQuestionTooltip
                                label="TR_TOKEN_UNRECOGNIZED_BY_TREZOR"
                                tooltip="TR_TOKEN_UNRECOGNIZED_BY_TREZOR_TOOLTIP"
                                addMarginTop={!!knownTokens.length}
                            />
                        )}
                        <Wrapper isTestnet={isTestnet} paddingType="none">
                            {tokens.map(t => {
                                const symbolMatchesName =
                                    networkType === 'cardano' &&
                                    t.symbol?.toLowerCase() === t.name?.toLowerCase();
                                const noSymbol = !t.symbol || symbolMatchesName;

                                const isTokenWithRate = Boolean(
                                    t.rates && Object.keys(t.rates).length,
                                );

                                return (
                                    <Fragment key={t.contract}>
                                        <Col isTestnet={isTestnet}>
                                            {!noSymbol && <TokenSymbol>{t.symbol}</TokenSymbol>}
                                            <TokenName>
                                                {!noSymbol && ` - `}
                                                {t.name}
                                            </TokenName>
                                        </Col>
                                        <Col isTestnet={isTestnet} justify="right">
                                            {t.balance && (
                                                <CryptoAmount
                                                    value={t.balance}
                                                    symbol={
                                                        networkType === 'cardano'
                                                            ? undefined
                                                            : t.symbol
                                                    }
                                                />
                                            )}
                                        </Col>
                                        {!isTestnet && (
                                            <Col isTestnet={isTestnet} justify="right">
                                                {t.balance && t.symbol && isTokenWithRate ? (
                                                    <FiatWrapper>
                                                        <FiatValue
                                                            amount={t.balance}
                                                            symbol={t.symbol}
                                                            tokenAddress={t.contract}
                                                        />
                                                    </FiatWrapper>
                                                ) : (
                                                    <StyledNoRatesTooltip />
                                                )}
                                            </Col>
                                        )}
                                        <Col isTestnet={isTestnet} justify="right">
                                            <TrezorLink
                                                href={`${explorerUrl}${t.contract}${explorerUrlQueryString}`}
                                            >
                                                <Icon
                                                    icon="EXTERNAL_LINK"
                                                    size={16}
                                                    color={theme.TYPE_LIGHT_GREY}
                                                />
                                            </TrezorLink>
                                        </Col>
                                    </Fragment>
                                );
                            })}
                        </Wrapper>
                    </Fragment>
                ) : null,
            )}
        </>
    );
};
